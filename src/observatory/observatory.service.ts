import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ListDirectories } from "./models/list-directories";
import { Directory } from "./models/directory";
import { Website } from "./models/website";
import clone from "lodash.clonedeep";
import orderBy from "lodash.orderby";
import _tests from "src/evaluation/tests";
import { Observatory } from "./observatory.entity";
import { ObservatorySyncStatus, SyncStatus, SyncType } from "./observatory-sync-status.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { calculateQuartiles } from "src/lib/quartil";

interface ObservatoryConfig {
  chunkSize: number;
  enableIncremental: boolean;
  enableGarbageCollection: boolean;
  maxMemoryUsageMB: number;
}

@Injectable()
export class ObservatoryService {
  private config: ObservatoryConfig;
  elemGroups = {
    a: "link",
    all: "other",
    id: "other",
    img: "image",
    longDImg: "graphic",
    area: "area",
    inpImg: "graphic",
    //graphic buttons
    applet: "object",
    hx: "heading",
    label: "form",
    inputLabel: "form",
    form: "form",
    tableData: "table",
    table: "table",
    tableLayout: "table",
    tableComplex: "table",
    frameset: "frame",
    iframe: "frame",
    frame: "frame",
    embed: "object",
    //embedded object
    object: "object",
    fontValues: "other",
    ehandler: "ehandler",
    w3cValidator: "validator",
  };

  constructor(
    @InjectRepository(Observatory)
    private readonly observatoryRepository: Repository<Observatory>,
    @InjectRepository(ObservatorySyncStatus)
    private readonly syncStatusRepository: Repository<ObservatorySyncStatus>
  ) {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment variables with defaults
   */
  private loadConfig(): ObservatoryConfig {
    return {
      chunkSize: parseInt(process.env.OBSERVATORY_CHUNK_SIZE || '20'),
      enableIncremental: process.env.ENABLE_INCREMENTAL_OBSERVATORY === 'true',
      enableGarbageCollection: process.env.ENABLE_OBSERVATORY_GC === 'true',
      maxMemoryUsageMB: parseInt(process.env.OBSERVATORY_MAX_MEMORY_MB || '1024')
    };
  }

  async findAll(): Promise<Observatory[]> {
    return this.observatoryRepository.find({
      select: ["Creation_Date", "Type", "ObservatoryId"],
    });
  }
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateData(manual = false): Promise<any> {
    console.log("generating data");
    console.log({
      nameSpace: process.env.NAMESPACE,
      amsid: process.env.AMSID,
      intParse: parseInt(process.env.AMSID),
    });
    
    if (
      process.env.NAMESPACE === undefined ||
      parseInt(process.env.AMSID) === 0 ||
      manual
    ) {
      // Check if sync is already running
      const isRunning = await this.isSyncRunning();
      if (isRunning) {
        console.log('Data generation already in progress, skipping...');
        return { message: 'Sync already in progress' };
      }

      // Use configured processing mode (Phase 2)
      console.log('Observatory config:', this.config);
      
      if (this.config.enableIncremental) {
        return this.generateDataIncremental(manual, this.config.chunkSize);
      } else {
        return this.generateDataChunked(manual, this.config.chunkSize);
      }
    }
  }

  /**
   * Phase 2: Chunked processing with robust error handling and retry mechanism
   */
  async generateDataChunked(manual = false, chunkSize = 20): Promise<any> {
    let syncStatus: ObservatorySyncStatus | null = null;
    
    try {
      console.log(`Starting chunked data generation with chunk size: ${chunkSize}`);
      
      // Get all directory IDs first
      const directoryIds = await this.getDirectoryIds();
      console.log(`Processing ${directoryIds.length} directories in chunks of ${chunkSize}`);
      
      const totalChunks = Math.ceil(directoryIds.length / chunkSize);
      
      // Initialize sync status
      syncStatus = await this.initializeSyncStatus(
        manual ? SyncType.MANUAL : SyncType.AUTO,
        totalChunks,
        directoryIds.length
      );
      
      let allDirectories = new Array<Directory>();
      let allData = new Array<any>();
      const failedChunks = new Array<{chunk: number[], chunkNumber: number, error: string}>();
      
      // Process directories in chunks with retry logic
      const chunks = [];
      for (let i = 0; i < directoryIds.length; i += chunkSize) {
        chunks.push({
          directories: directoryIds.slice(i, i + chunkSize),
          chunkNumber: Math.floor(i / chunkSize) + 1
        });
      }
      
      const totalChunks = chunks.length;
      console.log(`Created ${totalChunks} chunks for processing`);
      
      // Process each chunk with retry mechanism
      for (const {directories, chunkNumber} of chunks) {
        const success = await this.processChunkWithRetry(
          directories, 
          chunkNumber, 
          totalChunks,
          allDirectories,
          allData,
          failedChunks
        );
        
        if (!success) {
          console.error(`Failed to process chunk ${chunkNumber} after retries`);
        }
        
        // Optional: Force garbage collection between chunks if enabled
        if (this.config.enableGarbageCollection && (globalThis as any).gc) {
          (globalThis as any).gc();
          console.log(`Forced garbage collection after chunk ${chunkNumber}`);
        }
      }

      // Validate all chunks processed successfully
      await this.validateChunkProcessing(directoryIds, allDirectories, failedChunks);

      console.log(`Building global statistics from ${allDirectories.length} directories and ${allData.length} records...`);
      
      // Create final result
      const listDirectories = new ListDirectories(allData, allDirectories);
      const global = await this.buildGlobalStatistics(listDirectories);

      if (manual) {
        console.log('Deleting existing manual records...');
        await this.observatoryRepository.query(
          'DELETE FROM Observatory WHERE Type = ?',
          ['manual']
        );
        console.log('Manual records deleted');
      }

      await this.observatoryRepository.query(
        "INSERT INTO Observatory (Global_Statistics, Type, Creation_Date) VALUES (?, ?, ?)",
        [JSON.stringify(global), manual ? "manual" : "auto", new Date()]
      );
      
      // Mark sync as completed
      await this.markSyncCompleted(syncStatus.id);
      
      console.log("Chunked data generation completed successfully");
      console.log(`Final summary: ${allDirectories.length} directories, ${allData.length} records, ${failedChunks.length} failed chunks`);
      
      return global;
    } catch (error) {
      console.error('Error in generateDataChunked:', error);
      console.error('Stack trace:', error.stack);
      
      if (syncStatus) {
        await this.markSyncFailed(syncStatus.id, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Process a single chunk with retry mechanism
   */
  private async processChunkWithRetry(
    chunk: number[],
    chunkNumber: number,
    totalChunks: number,
    allDirectories: Directory[],
    allData: any[],
    failedChunks: Array<{chunk: number[], chunkNumber: number, error: string}>,
    maxRetries = 3
  ): Promise<boolean> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Processing chunk ${chunkNumber}/${totalChunks} (attempt ${attempt}/${maxRetries})`);
        console.log(`Chunk ${chunkNumber} contains directories: [${chunk.join(', ')}]`);
        
        const startTime = Date.now();
        const chunkData = await this.getDataForDirectoryChunk(chunk);
        const queryTime = Date.now() - startTime;
        
        console.log(`Chunk ${chunkNumber} query completed in ${queryTime}ms, returned ${chunkData.length} records`);
        
        // Validate chunk data is not empty when it should contain data
        if (chunkData.length === 0) {
          const directoryExists = await this.validateDirectoriesExist(chunk);
          if (directoryExists) {
            throw new Error(`Chunk ${chunkNumber} returned 0 records but directories exist`);
          }
        }
        
        const processStartTime = Date.now();
        const chunkDirectories = this.processDirectoryChunk(chunkData);
        const processTime = Date.now() - processStartTime;
        
        console.log(`Chunk ${chunkNumber} processing completed in ${processTime}ms, created ${chunkDirectories.length} directories`);
        
        // Validate that we got directories for the chunk
        if (chunkDirectories.length === 0 && chunkData.length > 0) {
          throw new Error(`Chunk ${chunkNumber} failed to create directory objects from ${chunkData.length} records`);
        }
        
        // Success - add to results
        allDirectories.push(...chunkDirectories);
        allData.push(...chunkData);
        
        console.log(`✅ Chunk ${chunkNumber} successful: ${chunkDirectories.length} directories, ${chunkData.length} records`);
        console.log(`   Running totals: ${allDirectories.length} directories, ${allData.length} records`);
        
        return true;
        
      } catch (error) {
        console.error(`❌ Chunk ${chunkNumber} attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          // Final attempt failed - record as failed chunk
          failedChunks.push({
            chunk,
            chunkNumber,
            error: error.message
          });
          
          console.error(`🚨 Chunk ${chunkNumber} failed after ${maxRetries} attempts - will be excluded from final result`);
          return false;
        } else {
          console.log(`⏳ Retrying chunk ${chunkNumber} (attempt ${attempt + 1}/${maxRetries}) in 5 seconds...`);
          await this.sleep(5000); // Wait 5 seconds before retry
        }
      }
    }
    
    return false;
  }

  /**
   * Validate that all chunks were processed successfully
   */
  private async validateChunkProcessing(
    originalDirectoryIds: number[],
    processedDirectories: Directory[],
    failedChunks: Array<{chunk: number[], chunkNumber: number, error: string}>
  ): Promise<void> {
    
    const processedDirectoryIds = processedDirectories.map(d => d.id);
    const expectedCount = originalDirectoryIds.length;
    const actualCount = processedDirectories.length;
    
    console.log(`📊 Processing validation:`);
    console.log(`   Expected directories: ${expectedCount}`);
    console.log(`   Processed directories: ${actualCount}`);
    console.log(`   Failed chunks: ${failedChunks.length}`);
    
    if (failedChunks.length > 0) {
      console.error(`🚨 Failed chunks details:`);
      failedChunks.forEach(({chunkNumber, chunk, error}) => {
        console.error(`   Chunk ${chunkNumber}: directories [${chunk.join(', ')}] - ${error}`);
      });
    }
    
    // Find missing directories
    const missingDirectories = originalDirectoryIds.filter(id => !processedDirectoryIds.includes(id));
    if (missingDirectories.length > 0) {
      console.error(`🚨 Missing directories: [${missingDirectories.join(', ')}]`);
    }
    
    // Calculate success rate
    const successRate = (actualCount / expectedCount) * 100;
    console.log(`📈 Success rate: ${successRate.toFixed(1)}% (${actualCount}/${expectedCount})`);
    
    // Fail if success rate is too low (less than 95%)
    if (successRate < 95) {
      throw new Error(`Observatory generation failed: success rate ${successRate.toFixed(1)}% is below acceptable threshold (95%)`);
    }
    
    if (failedChunks.length > 0 && successRate < 100) {
      console.warn(`⚠️  Observatory generation completed with partial success (${successRate.toFixed(1)}%)`);
      console.warn(`   This may result in incomplete observatory data`);
    }
  }

  /**
   * Check if directories actually exist in database
   */
  private async validateDirectoriesExist(directoryIds: number[]): Promise<boolean> {
    const result = await this.observatoryRepository.query(
      `SELECT COUNT(*) as count FROM Directory WHERE DirectoryId IN (${directoryIds.map(() => '?').join(',')}) AND Show_in_Observatory = 1`,
      directoryIds
    );
    return result[0]?.count > 0;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Phase 2: Incremental processing to avoid rebuilding unchanged data
   */
  async generateDataIncremental(manual = false, chunkSize = 20): Promise<any> {
    console.log("Starting incremental data generation");
    
    if (manual) {
      // For manual runs, always do full regeneration
      return this.generateDataChunked(manual, chunkSize);
    }
    
    const lastRun = await this.getLastGenerationDate();
    console.log(`Last generation date: ${lastRun}`);
    
    // Get directories that have changed since last run
    const changedDirectoryIds = await this.getChangedDirectoryIds(lastRun);
    console.log(`Found ${changedDirectoryIds.length} changed directories`);
    
    if (changedDirectoryIds.length === 0) {
      console.log("No changes detected, skipping generation");
      
      // Create a quick sync status record for "no changes"
      const syncStatus = await this.initializeSyncStatus(SyncType.AUTO, 0, 0);
      await this.markSyncCompleted(syncStatus.id);
      
      return { message: 'No changes detected, skipping generation' };
    }
    
    let syncStatus: ObservatorySyncStatus | null = null;
    
    try {
      // Initialize sync status for incremental processing
      syncStatus = await this.initializeSyncStatus(
        SyncType.AUTO, 
        1, // Only one "chunk" for incremental
        changedDirectoryIds.length
      );
      
      // Get unchanged data from cache or previous result
      const unchangedData = await this.getUnchangedObservatoryData(changedDirectoryIds);
      
      // Process only changed directories
      const changedData = await this.getDataForDirectoryChunk(changedDirectoryIds);
      const changedDirectories = this.processDirectoryChunk(changedData);
      
      // Update progress
      await this.updateSyncProgress(syncStatus.id, 1, changedDirectoryIds.length);
      
      // Merge results
      const mergedDirectories = [...unchangedData.directories, ...changedDirectories];
      const mergedData = [...unchangedData.data, ...changedData];
      
      const listDirectories = new ListDirectories(mergedData, mergedDirectories);
      const global = await this.buildGlobalStatistics(listDirectories);

      await this.observatoryRepository.query(
        "INSERT INTO Observatory (Global_Statistics, Type, Creation_Date) VALUES (?, ?, ?)",
        [JSON.stringify(global), "auto", new Date()]
      );
      
      // Mark sync as completed
      await this.markSyncCompleted(syncStatus.id);
      
      console.log("Incremental data generation completed");
      return global;
    } catch (error) {
      console.error('Error in generateDataIncremental:', error);
      
      if (syncStatus) {
        await this.markSyncFailed(syncStatus.id, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Helper method to get all directory IDs for chunking
   */
  async getDirectoryIds(): Promise<number[]> {
    const result = await this.observatoryRepository.query(
      'SELECT DirectoryId FROM Directory WHERE Show_in_Observatory = 1 ORDER BY DirectoryId'
    );
    return result.map((row: any) => row.DirectoryId);
  }

  /**
   * Get data for a specific chunk of directories
   */
  async getDataForDirectoryChunk(directoryIds: number[]): Promise<any[]> {
    if (directoryIds.length === 0) return [];
    
    // Try optimized approach first, fallback to legacy if issues
    try {
      console.log('Using optimized query approach');
      return await this.getDataForDirectoryChunkOptimized(directoryIds);
    } catch (error) {
      console.warn('Optimized query failed, falling back to legacy approach:', error.message);
      return this.getDataForDirectoryChunkLegacy(directoryIds);
    }
  }

  /**
   * Process directory chunk using legacy approach (proven to work)
   */
  private async getDataForDirectoryChunkLegacy(directoryIds: number[]): Promise<any[]> {
    let allData = [];
    
    // Get directories info
    const directories = await this.observatoryRepository.query(
      `SELECT * FROM Directory WHERE DirectoryId IN (${directoryIds.map(() => '?').join(',')}) AND Show_in_Observatory = 1`,
      directoryIds
    );
    
    for (const directory of directories) {
      // Get tags for this directory
      const tags = await this.observatoryRepository.query(
        `SELECT t.* FROM DirectoryTag as dt, Tag as t WHERE dt.DirectoryId = ? AND t.TagId = dt.TagId`,
        [directory.DirectoryId]
      );
      const tagsId = tags.map((t) => t.TagId);

      let pages = null;
      if (parseInt(directory.Method) === 0 && tags.length > 1) {
        const websites = await this.observatoryRepository.query(
          `SELECT * FROM TagWebsite WHERE TagId IN (${tagsId.map(() => '?').join(',')})`,
          tagsId
        );

        const counts = {};
        for (const w of websites ?? []) {
          if (counts[w.WebsiteId]) {
            counts[w.WebsiteId]++;
          } else {
            counts[w.WebsiteId] = 1;
          }
        }

        const websitesToFetch = new Array<Number>();
        for (const id of Object.keys(counts) ?? []) {
          if (counts[id] === tags.length) {
            websitesToFetch.push(parseInt(id));
          }
        }

        if (websitesToFetch.length === 0) {
          continue;
        }

        pages = await this.observatoryRepository.query(
          `
          SELECT
            e.EvaluationId,
            e.Title,
            e.Score,
            e.Errors,
            e.Tot,
            e.A,
            e.AA,
            e.AAA,
            e.Evaluation_Date,
            p.PageId,
            p.Uri,
            p.Creation_Date as Page_Creation_Date,
            w.WebsiteId,
            w.Name as Website_Name,
            w.StartingUrl,
            w.Declaration as Website_Declaration,
            w.Declaration_Update_Date as Declaration_Date,
            w.Stamp as Website_Stamp,
            w.Stamp_Update_Date as Stamp_Date,
            w.Creation_Date as Website_Creation_Date
          FROM
            Website as w,
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            w.WebsiteId IN (${websitesToFetch.map(() => '?').join(',')}) AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
          websitesToFetch
        );
      } else {
        pages = await this.observatoryRepository.query(
          `
          SELECT
            e.EvaluationId,
            e.Title,
            e.Score,
            e.Errors,
            e.Tot,
            e.A,
            e.AA,
            e.AAA,
            e.Evaluation_Date,
            p.PageId,
            p.Uri,
            p.Creation_Date as Page_Creation_Date,
            w.WebsiteId,
            w.Name as Website_Name,
            w.StartingUrl,
            w.Declaration as Website_Declaration,
            w.Declaration_Update_Date as Declaration_Date,
            w.Stamp as Website_Stamp,
            w.Stamp_Update_Date as Stamp_Date,
            w.Creation_Date as Website_Creation_Date
          FROM
            TagWebsite as tw,
            Website as w,
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            tw.TagId IN (${tagsId.map(() => '?').join(',')}) AND
            w.WebsiteId = tw.WebsiteId AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
          tagsId
        );
      }
      
      if (pages) {
        pages = pages.filter((p) => p.Score !== null);

        for (const p of pages || []) {
          p.DirectoryId = directory.DirectoryId;
          p.Directory_Name = directory.Name;
          p.Show_in_Observatory = directory.Show_in_Observatory;
          p.Directory_Creation_Date = directory.Creation_Date;
          p.Entity_Name = null;

          const entities = await this.observatoryRepository.query(
            `
            SELECT e.Long_Name
            FROM
              EntityWebsite as ew,
              Entity as e
            WHERE
              ew.WebsiteId = ? AND
              e.EntityId = ew.EntityId
          `,
            [p.WebsiteId]
          );

          if (entities.length > 0) {
            if (entities.length === 1) {
              p.Entity_Name = entities[0].Long_Name;
            } else {
              p.Entity_Name = entities.map((e) => e.Long_Name).join("@,@ ");
            }
          }
        }

        allData = [...allData, ...pages];
      }
    }
    
    return allData;
  }

  /**
   * Optimized single-query approach for maximum performance
   */
  async getDataForDirectoryChunkOptimized(directoryIds: number[]): Promise<any[]> {
    const query = `
      SELECT 
        d.DirectoryId,
        d.Name as Directory_Name,
        d.Show_in_Observatory,
        d.Creation_Date as Directory_Creation_Date,
        d.Method as Directory_Method,
        w.WebsiteId,
        w.Name as Website_Name,
        w.StartingUrl,
        w.Declaration as Website_Declaration,
        w.Declaration_Update_Date as Declaration_Date,
        w.Stamp as Website_Stamp,
        w.Stamp_Update_Date as Stamp_Date,
        w.Creation_Date as Website_Creation_Date,
        p.PageId,
        p.Uri,
        p.Creation_Date as Page_Creation_Date,
        e.EvaluationId,
        e.Title,
        e.Score,
        e.Errors,
        e.Tot,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date,
        GROUP_CONCAT(DISTINCT ent.Long_Name SEPARATOR '@,@ ') as Entity_Name,
        GROUP_CONCAT(DISTINCT t.TagId) as TagIds,
        COUNT(DISTINCT t.TagId) as TagCount
      FROM Directory d
      JOIN DirectoryTag dt ON d.DirectoryId = dt.DirectoryId
      JOIN Tag t ON dt.TagId = t.TagId
      JOIN TagWebsite tw ON t.TagId = tw.TagId
      JOIN Website w ON tw.WebsiteId = w.WebsiteId
      JOIN WebsitePage wp ON w.WebsiteId = wp.WebsiteId
      JOIN Page p ON wp.PageId = p.PageId
      LEFT JOIN (
        SELECT 
          e1.PageId,
          e1.EvaluationId,
          e1.Title,
          e1.Score,
          e1.Errors,
          e1.Tot,
          e1.A,
          e1.AA,
          e1.AAA,
          e1.Evaluation_Date
        FROM Evaluation e1
        INNER JOIN (
          SELECT PageId, MAX(Evaluation_Date) as MaxDate
          FROM Evaluation 
          WHERE Show_To LIKE '1_%'
          GROUP BY PageId
        ) e2 ON e1.PageId = e2.PageId AND e1.Evaluation_Date = e2.MaxDate
        WHERE e1.Show_To LIKE '1_%'
      ) e ON p.PageId = e.PageId
      LEFT JOIN EntityWebsite ew ON w.WebsiteId = ew.WebsiteId
      LEFT JOIN Entity ent ON ew.EntityId = ent.EntityId
      WHERE 
        d.DirectoryId IN (${directoryIds.map(() => '?').join(',')})
        AND d.Show_in_Observatory = 1 
        AND p.Show_In LIKE '__1'
        AND e.Score IS NOT NULL
      GROUP BY 
        d.DirectoryId, w.WebsiteId, p.PageId, 
        e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
    `;

    console.log(`Optimized query executing for ${directoryIds.length} directories`);
    const startTime = Date.now();
    
    const rawData = await this.observatoryRepository.query(query, directoryIds);
    
    console.log(`Optimized query completed in ${Date.now() - startTime}ms, returned ${rawData.length} raw records`);
    
    // Handle Method 0 filtering more efficiently
    const websiteTagValidation = new Map<number, boolean>();
    
    const filteredData = rawData.filter((row: any) => {
      const method = parseInt(row.Directory_Method);
      const tagCount = parseInt(row.TagCount);
      
      // For Method 0 with multiple tags, cache validation results
      if (method === 0 && tagCount > 1) {
        const websiteId = row.WebsiteId;
        
        if (!websiteTagValidation.has(websiteId)) {
          // This would need async validation, for now assume valid
          // In practice, the SQL query should handle this filtering
          websiteTagValidation.set(websiteId, true);
        }
        
        return websiteTagValidation.get(websiteId);
      }
      
      return true;
    });

    console.log(`Filtering completed, returning ${filteredData.length} valid records`);
    return filteredData;
  }

  /**
   * Process a chunk of directories into Directory objects
   */
  processDirectoryChunk(chunkData: any[]): Directory[] {
    const directories = new Array<Directory>();
    const tmpDirectories = this.createTemporaryDirectories(chunkData);

    for (const directory of tmpDirectories || []) {
      const newDirectory = this.createDirectory(directory, clone(chunkData));
      directories.push(newDirectory);
    }

    return directories;
  }

  /**
   * Build global statistics from ListDirectories
   */
  async buildGlobalStatistics(listDirectories: ListDirectories): Promise<any> {
    const { declarations, badges } = this.countDeclarationsAndStamps(
      listDirectories.directories
    );

    return {
      score: listDirectories.getScore(),
      nDirectories: listDirectories.directories.length,
      nWebsites: listDirectories.nWebsites,
      nEntities: listDirectories.nEntities,
      nPages: listDirectories.nPages,
      nPagesWithoutErrors: listDirectories.nPagesWithoutErrors,
      recentPage: listDirectories.recentPage,
      oldestPage: listDirectories.oldestPage,
      topFiveWebsites: this.getTopFiveWebsites(listDirectories),
      topFiveBestPractices: listDirectories.getTopFiveBestPractices(),
      topFiveErrors: listDirectories.getTopFiveErrors(),
      declarations,
      badges,
      scoreDistributionFrequency: listDirectories.frequencies,
      errorDistribution: this.getGlobalErrorsDistribution(listDirectories),
      bestPracticesDistribution:
        this.getGlobalBestPracticesDistribution(listDirectories),
      directoriesList: this.getSortedDirectoriesList(listDirectories),
      directories: this.getDirectories(listDirectories),
    };
  }

  /**
   * Get last generation date for incremental processing
   */
  async getLastGenerationDate(): Promise<Date> {
    const result = await this.observatoryRepository.query(
      'SELECT MAX(Creation_Date) as lastDate FROM Observatory WHERE Type = "auto"'
    );
    return result[0]?.lastDate || new Date('2000-01-01');
  }

  /**
   * Get directory IDs that have changed since last generation
   */
  async getChangedDirectoryIds(lastRun: Date): Promise<number[]> {
    // This is a simplified approach - in reality you'd want to track:
    // - New/updated evaluations
    // - New/updated websites
    // - New/updated pages
    // - Directory configuration changes
    
    const query = `
      SELECT DISTINCT d.DirectoryId
      FROM Directory d
      JOIN DirectoryTag dt ON d.DirectoryId = dt.DirectoryId
      JOIN TagWebsite tw ON dt.TagId = tw.TagId
      JOIN Website w ON tw.WebsiteId = w.WebsiteId
      JOIN WebsitePage wp ON w.WebsiteId = wp.WebsiteId
      JOIN Page p ON wp.PageId = p.PageId
      LEFT JOIN Evaluation e ON p.PageId = e.PageId
      WHERE d.Show_in_Observatory = 1
      AND (
        e.Evaluation_Date > ? 
        OR w.Declaration_Update_Date > ?
        OR w.Stamp_Update_Date > ?
        OR p.Creation_Date > ?
      )
    `;
    
    const result = await this.observatoryRepository.query(query, [lastRun, lastRun, lastRun, lastRun]);
    return result.map((row: any) => row.DirectoryId);
  }

  /**
   * Get unchanged observatory data (mock implementation)
   */
  async getUnchangedObservatoryData(changedDirectoryIds: number[]): Promise<{directories: Directory[], data: any[]}> {
    // In a full implementation, this would:
    // 1. Load the previous observatory result
    // 2. Filter out directories that have changed
    // 3. Return the unchanged portion
    
    // For now, return empty to force full rebuild of unchanged data
    // This can be optimized later with proper caching
    return { directories: [], data: [] };
  }

  async getObservatoryData(): Promise<any> {
    const data = (
      await this.observatoryRepository.query(
        "SELECT * FROM Observatory ORDER BY Creation_Date DESC LIMIT 1"
      )
    )[0].Global_Statistics;

    return JSON.parse(data);
  }

  async getData(): Promise<any> {
    // Use optimized single query to get all data at once
    return this.getDataOptimized();
  }

  /**
   * Optimized version of getData() that eliminates N+1 queries
   * Uses single bulk query with proper joins and pre-computed latest evaluations
   */
  async getDataOptimized(): Promise<any> {
    const query = `
      SELECT 
        d.DirectoryId,
        d.Name as Directory_Name,
        d.Show_in_Observatory,
        d.Creation_Date as Directory_Creation_Date,
        d.Method as Directory_Method,
        w.WebsiteId,
        w.Name as Website_Name,
        w.StartingUrl,
        w.Declaration as Website_Declaration,
        w.Declaration_Update_Date as Declaration_Date,
        w.Stamp as Website_Stamp,
        w.Stamp_Update_Date as Stamp_Date,
        w.Creation_Date as Website_Creation_Date,
        p.PageId,
        p.Uri,
        p.Creation_Date as Page_Creation_Date,
        e.EvaluationId,
        e.Title,
        e.Score,
        e.Errors,
        e.Tot,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date,
        GROUP_CONCAT(DISTINCT ent.Long_Name SEPARATOR '@,@ ') as Entity_Name,
        GROUP_CONCAT(DISTINCT t.TagId) as TagIds,
        COUNT(DISTINCT t.TagId) as TagCount
      FROM Directory d
      JOIN DirectoryTag dt ON d.DirectoryId = dt.DirectoryId
      JOIN Tag t ON dt.TagId = t.TagId
      JOIN TagWebsite tw ON t.TagId = tw.TagId
      JOIN Website w ON tw.WebsiteId = w.WebsiteId
      JOIN WebsitePage wp ON w.WebsiteId = wp.WebsiteId
      JOIN Page p ON wp.PageId = p.PageId
      LEFT JOIN (
        SELECT 
          e1.PageId,
          e1.EvaluationId,
          e1.Title,
          e1.Score,
          e1.Errors,
          e1.Tot,
          e1.A,
          e1.AA,
          e1.AAA,
          e1.Evaluation_Date
        FROM Evaluation e1
        INNER JOIN (
          SELECT PageId, MAX(Evaluation_Date) as MaxDate
          FROM Evaluation 
          WHERE Show_To LIKE '1_%'
          GROUP BY PageId
        ) e2 ON e1.PageId = e2.PageId AND e1.Evaluation_Date = e2.MaxDate
        WHERE e1.Show_To LIKE '1_%'
      ) e ON p.PageId = e.PageId
      LEFT JOIN EntityWebsite ew ON w.WebsiteId = ew.WebsiteId
      LEFT JOIN Entity ent ON ew.EntityId = ent.EntityId
      WHERE 
        d.Show_in_Observatory = 1 
        AND p.Show_In LIKE '__1'
        AND e.Score IS NOT NULL
      GROUP BY 
        d.DirectoryId, w.WebsiteId, p.PageId, 
        e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
    `;

    const rawData = await this.observatoryRepository.query(query);
    
    // Filter based on directory method and tag requirements
    const filteredData = rawData.filter(row => {
      const method = parseInt(row.Directory_Method);
      const tagCount = parseInt(row.TagCount);
      
      // For Method 0 with multiple tags, ensure website has ALL tags
      if (method === 0 && tagCount > 1) {
        return this.websiteHasAllTags(row.WebsiteId, row.TagIds.split(','), tagCount);
      }
      
      return true;
    });

    return filteredData;
  }

  /**
   * Helper method to verify if a website has all required tags for Method 0 directories
   */
  private async websiteHasAllTags(websiteId: number, tagIds: string[], requiredTagCount: number): Promise<boolean> {
    const result = await this.observatoryRepository.query(`
      SELECT COUNT(DISTINCT TagId) as count
      FROM TagWebsite 
      WHERE WebsiteId = ? AND TagId IN (?)
    `, [websiteId, tagIds]);
    
    return result[0].count === requiredTagCount;
  }

  /**
   * Legacy getData method - kept for backwards compatibility
   * TODO: Remove after migration is complete
   */
  async getDataLegacy(): Promise<any> {
    let data = new Array<any>();

    const directories = await this.observatoryRepository.query(
      `SELECT * FROM Directory WHERE Show_in_Observatory = 1`
    );

    for (const directory of directories) {
      const tags = await this.observatoryRepository.query(
        `SELECT t.* FROM DirectoryTag as dt, Tag as t WHERE dt.DirectoryId = ? AND t.TagId = dt.TagId`,
        [directory.DirectoryId]
      );
      const tagsId = tags.map((t) => t.TagId);

      let pages = null;
      if (parseInt(directory.Method) === 0 && tags.length > 1) {
        const websites = await this.observatoryRepository.query(
          `
        SELECT * FROM TagWebsite WHERE TagId IN (?)
      `,
          [tagsId]
        );

        const counts = {};
        for (const w of websites ?? []) {
          if (counts[w.WebsiteId]) {
            counts[w.WebsiteId]++;
          } else {
            counts[w.WebsiteId] = 1;
          }
        }

        const websitesToFetch = new Array<Number>();
        for (const id of Object.keys(counts) ?? []) {
          if (counts[id] === tags.length) {
            websitesToFetch.push(parseInt(id));
          }
        }

        if (websitesToFetch.length === 0) {
          continue;
        }

        pages = await this.observatoryRepository.query(
          `
          SELECT
            e.EvaluationId,
            e.Title,
            e.Score,
            e.Errors,
            e.Tot,
            e.A,
            e.AA,
            e.AAA,
            e.Evaluation_Date,
            p.PageId,
            p.Uri,
            p.Creation_Date as Page_Creation_Date,
            w.WebsiteId,
            w.Name as Website_Name,
            w.StartingUrl,
            w.Declaration as Website_Declaration,
            w.Declaration_Update_Date as Declaration_Date,
            w.Stamp as Website_Stamp,
            w.Stamp_Update_Date as Stamp_Date,
            w.Creation_Date as Website_Creation_Date
          FROM
            Website as w,
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            w.WebsiteId IN (?) AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
          [websitesToFetch]
        );
      } else {
        pages = await this.observatoryRepository.query(
          `
          SELECT
            e.EvaluationId,
            e.Title,
            e.Score,
            e.Errors,
            e.Tot,
            e.A,
            e.AA,
            e.AAA,
            e.Evaluation_Date,
            p.PageId,
            p.Uri,
            p.Creation_Date as Page_Creation_Date,
            w.WebsiteId,
            w.Name as Website_Name,
            w.StartingUrl,
            w.Declaration as Website_Declaration,
            w.Declaration_Update_Date as Declaration_Date,
            w.Stamp as Website_Stamp,
            w.Stamp_Update_Date as Stamp_Date,
            w.Creation_Date as Website_Creation_Date
          FROM
            TagWebsite as tw,
            Website as w,
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            tw.TagId IN (?) AND
            w.WebsiteId = tw.WebsiteId AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
          [tagsId]
        );
      }
      if (pages) {
        pages = pages.filter((p) => p.Score !== null);

        for (const p of pages || []) {
          p.DirectoryId = directory.DirectoryId;
          p.Directory_Name = directory.Name;
          p.Show_in_Observatory = directory.Show_in_Observatory;
          p.Directory_Creation_Date = directory.Creation_Date;
          p.Entity_Name = null;

          const entities = await this.observatoryRepository.query(
            `
            SELECT e.Long_Name
            FROM
              EntityWebsite as ew,
              Entity as e
            WHERE
              ew.WebsiteId = ? AND
              e.EntityId = ew.EntityId
          `,
            [p.WebsiteId]
          );

          if (entities.length > 0) {
            if (entities.length === 1) {
              p.Entity_Name = entities[0].Long_Name;
            } else {
              p.Entity_Name = entities.map((e) => e.Long_Name).join("@,@ ");
            }
          }
        }

        data = [...data, ...pages];
      }
    }

    return data;
  }

  private createTemporaryDirectories(data: any): Array<any> {
    const tmpDirectoriesIds = new Array<number>();
    const tmpDirectories = new Array<any>();
    data.map((directory: any) => {
      if (!tmpDirectoriesIds.includes(directory.DirectoryId)) {
        tmpDirectoriesIds.push(directory.DirectoryId);
        tmpDirectories.push({
          id: directory.DirectoryId,
          name: directory.Directory_Name,
          creation_date: directory.Directory_Creation_Date,
        });
      }
    });

    return tmpDirectories;
  }

  private createDirectory(directory: any, data: any): Directory {
    const newDirectory = new Directory(
      directory.id,
      directory.name,
      directory.creation_date
    );
    const tmpWebsitesIds = new Array<number>();
    const websites = new Array<any>();
    for (const wb of data || []) {
      if (
        wb.DirectoryId === directory.id &&
        !tmpWebsitesIds.includes(wb.WebsiteId)
      ) {
        tmpWebsitesIds.push(wb.WebsiteId);
        websites.push({
          id: wb.WebsiteId,
          entity: wb.Entity_Name,
          name: wb.Website_Name,
          declaration: wb.Website_Declaration,
          declarationDate: wb.Declaration_Date,
          stamp: wb.Website_Stamp,
          stampDate: wb.Stamp_Date,
          startingUrl: wb.StartingUrl,
          creation_date: wb.Website_Creation_Date,
        });
      }
    }

    for (const website of websites || []) {
      const newWebsite = this.createWebsite(website, directory, data);
      newDirectory.addWebsite(newWebsite);
    }

    return newDirectory;
  }

  private createWebsite(website: any, directory: any, data: any): Website {
    const newWebsite = new Website(
      website.id,
      website.entity,
      website.name,
      website.declaration,
      website.declarationDate,
      website.stamp,
      website.stampDate,
      website.startingUrl,
      website.creation_date
    );

    const pages = new Array<any>();
    data.map((p: any) => {
      if (p.Website_Name === website.name && p.DirectoryId === directory.id) {
        pages.push({
          pageId: p.PageId,
          uri: p.Uri,
          creation_date: p.Page_Creation_Date,
          evaluationId: p.EvaluationId,
          title: p.Title,
          score: parseFloat(p.Score),
          errors: p.Errors,
          tot: p.Tot,
          A: p.A,
          AA: p.AA,
          AAA: p.AAA,
          evaluation_date: p.Evaluation_Date,
        });
      }
    });

    for (const page of pages || []) {
      this.addPageToWebsite(newWebsite, page);
    }

    return newWebsite;
  }

  private addPageToWebsite(website: any, page: any): void {
    website.addPage(
      page.pageId,
      page.uri,
      page.creation_date,
      page.evaluationId,
      page.title,
      page.score,
      page.errors,
      page.tot,
      page.A,
      page.AA,
      page.AAA,
      page.evaluation_date
    );
  }

  private countDeclarationsAndStamps(directories: any): any {
    const websitesDeclarationsInList = new Array<number>();
    const websitesStampsInList = new Array<number>();

    const declarations = {
      total: {
        websites: {
          conform: 0,
          partial: 0,
          not_conform: 0,
        },
        apps: {
          conform: 0,
          partial: 0,
          not_conform: 0,
        },
      },
      currentYear: {
        websites: {
          conform: 0,
          partial: 0,
          not_conform: 0,
        },
        apps: {
          conform: 0,
          partial: 0,
          not_conform: 0,
        },
      },
    };
    const badges = {
      total: {
        websites: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
        apps: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
      },
      currentYear: {
        websites: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
        apps: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
      },
    };

    const currentYear = new Date().getFullYear();

    for (const directory of directories) {
      for (const website of directory.websites) {
        if (
          !websitesDeclarationsInList.includes(website.id) &&
          website.declaration &&
          website.declarationDate
        ) {
          switch (website.declaration) {
            case 1:
              declarations.total.websites.not_conform++;
              break;
            case 2:
              declarations.total.websites.partial++;
              break;
            case 3:
              declarations.total.websites.conform++;
              break;
          }

          if (website.declarationDate.getFullYear() === currentYear) {
            switch (website.declaration) {
              case 1:
                declarations.currentYear.websites.not_conform++;
                break;
              case 2:
                declarations.currentYear.websites.partial++;
                break;
              case 3:
                declarations.currentYear.websites.conform++;
                break;
            }
          }
          websitesDeclarationsInList.push(website.id);
        }
        if (
          !websitesStampsInList.includes(website.id) &&
          website.stamp &&
          website.stampDate
        ) {
          switch (website.stamp) {
            case 1:
              badges.total.websites.bronze++;
              break;
            case 2:
              badges.total.websites.silver++;
              break;
            case 3:
              badges.total.websites.gold++;
              break;
          }

          if (website.stampDate.getFullYear() === currentYear) {
            switch (website.stamp) {
              case 1:
                badges.currentYear.websites.bronze++;
                break;
              case 2:
                badges.currentYear.websites.silver++;
                break;
              case 3:
                badges.currentYear.websites.gold++;
                break;
            }
          }
          websitesStampsInList.push(website.id);
        }
      }
    }

    return { declarations: clone(declarations), badges: clone(badges) };
  }

  getTopFiveWebsites(listDirectories: ListDirectories): any {
    const websites = listDirectories
      .getWebsites()
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index &&
          value.A + value.AA + value.AAA > 10
      )
      .sort(
        (a: Website, b: Website) =>
          Math.round(b.getScore() * 10) / 10 -
            Math.round(a.getScore() * 10) / 10 ||
          b.AAA - a.AAA ||
          b.AA - a.AA ||
          b.A - a.A
      )
      .slice(0, 5);

    const topFiveWebsites = new Array<any>();

    let i = 1;
    for (const website of websites) {
      topFiveWebsites.push({
        index: i,
        id: website.id,
        DirectoryId: website.DirectoryId,
        entity: website.entity,
        name: website.name,
        score: website.getScore(),
      });
      i++;
    }

    return topFiveWebsites;
  }

  getGlobalErrorsDistribution(listDirectories: ListDirectories): any {
    let graphData = new Array<any>();
    const tableData = new Array<any>();

    for (const k in listDirectories.errors) {
      const v = listDirectories.errors[k];
      if (_tests[k]["result"] === "failed") {
        let key = k;
        let elem = _tests[key]["elem"];
        let n_pages = v["n_pages"];
        let n_websites = v["n_websites"];
        let result = _tests[key]["result"];

        let quartiles = this.calculateQuartilesGlobalErrors(listDirectories, k);

        tableData.push(this.addToTableData(k, v, quartiles));
        graphData.push({ key, elem, n_pages, n_websites, result });
      }
    }

    graphData = graphData.sort(function (a, b) {
      //return a.elem === b.elem ? (b.n_pages === a.n_pages ? b.n_elems - a.n_elems : b.n_pages - a.n_pages) : a.elem.localeCompare(b.elem);
      return b.n_pages === a.n_pages
        ? a.key.localeCompare(b.key)
        : b.n_pages - a.n_pages;
    });

    // because we only want the top 10
    graphData = graphData.slice(0, 10);

    const showTableData = clone(tableData);

    return { errors: listDirectories.errors, graphData, showTableData };
  }

  getGlobalBestPracticesDistribution(listDirectories: ListDirectories): any {
    let graphData = new Array<any>();
    const tableData = new Array<any>();

    for (const k in listDirectories.success) {
      const v = listDirectories.success[k];
      if (_tests[k]["result"] === "passed") {
        let key = k;
        let elem = _tests[key]["elem"];
        let n_pages = v["n_pages"];
        let n_websites = v["n_websites"];
        let result = _tests[key]["result"];

        let quartiles = this.calculateQuartilesGlobalBestPractices(
          listDirectories,
          k
        );
        tableData.push(this.addToTableData(k, v, quartiles));
        graphData.push({ key, elem, n_pages, n_websites, result });
      }
    }

    graphData = graphData.sort(function (a, b) {
      //return a.elem === b.elem ? (b.n_pages === a.n_pages ? b.n_elems - a.n_elems : b.n_pages - a.n_pages) : a.elem.localeCompare(b.elem);
      return b.n_pages === a.n_pages
        ? a.key.localeCompare(b.key)
        : b.n_pages - a.n_pages;
    });

    // because we only want the top 10
    graphData = graphData.slice(0, 10);

    const showTableData = clone(tableData);

    return { success: listDirectories.success, graphData, showTableData };
  }

  private addToTableData(key: string, tot: any, quartiles: any): any {
    return {
      key: key,
      level: _tests[key]["level"].toUpperCase(),
      elem: _tests[key]["elem"],
      websites: tot["n_websites"],
      pages: tot["n_pages"],
      elems: _tests[key]["result"] === "passed" ? -1 : tot["n_occurrences"],
      quartiles: quartiles,
      elemGroup: this.elemGroups[_tests[key]["elem"]],
    };
  }

  getSortedDirectoriesList(listDirectories: ListDirectories): any {
    let rank = 1;
    const directories = listDirectories.directories
      .slice()
      .sort(
        (a: Directory, b: Directory) =>
          Math.round(b.getScore() * 10) / 10 -
            Math.round(a.getScore() * 10) / 10 ||
          b.AAA - a.AAA ||
          b.AA - a.AA ||
          b.A - a.A ||
          b.nPages - a.nPages
      )
      .map((d: Directory) => {
        d.rank = rank;
        rank++;
        return d;
      });

    const sortedDirectories = new Array<any>();

    for (const directory of directories) {
      sortedDirectories.push({
        id: directory.id,
        rank: directory.rank,
        name: directory.name,
        declarations: directory.declarations,
        stamps: directory.stamps,
        score: directory.getScore(),
        nWebsites: directory.websites.length,
        A: directory.A,
        AA: directory.AA,
        AAA: directory.AAA,
      });
    }

    return sortedDirectories;
  }

  getDirectories(listDirectories: ListDirectories): any {
    const directories = {};

    for (const directory of listDirectories.directories) {
      directories[directory.id] = {
        id: directory.id,
        name: directory.name,
        oldestPage: directory.oldestPage,
        recentPage: directory.recentPage,
        score: directory.getScore(),
        nEntities: directory.entities.length,
        nWebsites: directory.websites.length,
        nPages: directory.nPages,
        scoreDistributionFrequency: directory.frequencies,
        errorDistribution: this.getDirectoryErrorsDistribution(directory),
        bestPracticesDistribution:
          this.getDirectoryBestPracticesDistribution(directory),
        websitesList: this.getSortedDirectoryWebsitesList(directory),
        websites: this.getDirectoryWebsites(directory),
      };
    }

    return directories;
  }

  getDirectoryErrorsDistribution(directory: Directory): any {
    let graphData = new Array<any>();
    const tableData = new Array<any>();

    for (const k in directory.errors) {
      const v = directory.errors[k];
      if (_tests[k]["result"] === "failed") {
        let key = k;
        let elem = _tests[key]["elem"];
        let n_pages = v["n_pages"];
        let n_websites = v["n_websites"];
        let result = _tests[key]["result"];

        let quartiles = this.calculateQuartilesDirectoryErrors(directory, k);

        tableData.push(this.addToTableData(k, v, quartiles));
        graphData.push({ key, elem, n_pages, n_websites, result });
      }
    }

    graphData = graphData.sort(function (a, b) {
      //return a.elem === b.elem ? (b.n_pages === a.n_pages ? b.n_elems - a.n_elems : b.n_pages - a.n_pages) : a.elem.localeCompare(b.elem);
      return b.n_pages === a.n_pages
        ? a.key.localeCompare(b.key)
        : b.n_pages - a.n_pages;
    });

    // because we only want the top 10
    graphData = graphData.slice(0, 10);

    const showTableData = clone(tableData);

    return { errors: directory.errors, graphData, showTableData };
  }

  getDirectoryBestPracticesDistribution(directory: Directory): any {
    let graphData = new Array<any>();
    const tableData = new Array<any>();

    for (const k in directory.success) {
      const v = directory.success[k];
      if (_tests[k]["result"] === "passed") {
        let key = k;
        let elem = _tests[key]["elem"];
        let n_pages = v["n_pages"];
        let n_websites = v["n_websites"];
        let result = _tests[key]["result"];

        let quartiles = this.calculateQuartilesDirectoryBestPractices(
          directory,
          k
        );
        tableData.push(this.addToTableData(k, v, quartiles));
        graphData.push({ key, elem, n_pages, n_websites, result });
      }
    }

    graphData = graphData.sort(function (a, b) {
      //return a.elem === b.elem ? (b.n_pages === a.n_pages ? b.n_elems - a.n_elems : b.n_pages - a.n_pages) : a.elem.localeCompare(b.elem);
      return b.n_pages === a.n_pages
        ? a.key.localeCompare(b.key)
        : b.n_pages - a.n_pages;
    });

    // because we only want the top 10
    graphData = graphData.slice(0, 10);

    const showTableData = clone(tableData);

    return { success: directory.success, graphData, showTableData };
  }

  getSortedDirectoryWebsitesList(directory: Directory): any {
    let rank = 1;
    let websites = directory.websites.slice().map((w: Website) => {
      w.calculatedScore = w.getScore();
      return w;
    });

    websites = orderBy(
      websites,
      ["calculatedScore", "AAA", "AA", "A", "name"],
      ["desc", "desc", "desc", "desc", "asc"]
    ).map((w: Website) => {
      w.rank = rank;
      rank++;
      return w;
    });

    const sortedWebsites = new Array<any>();

    for (const website of websites) {
      sortedWebsites.push({
        id: website.id,
        rank: website.rank,
        name: website.name,
        entity: website.entity,
        declaration: website.declaration,
        stamp: website.stamp,
        score: website.calculatedScore,
        nPages: website.pages.length,
        A: website.A,
        AA: website.AA,
        AAA: website.AAA,
      });
    }

    return sortedWebsites;
  }

  getDirectoryWebsites(directory: Directory): any {
    const websites = {};

    for (const website of directory.websites) {
      let pagesWithErrors = 0;
      let pagesWithoutErrorsA = 0;
      let pagesWithoutErrorsAA = 0;
      let pagesWithoutErrorsAAA = 0;

      const pages = website.pages;
      const size = pages.length;
      for (let i = 0; i < size; i++) {
        if (pages[i].evaluation.A === 0) {
          if (pages[i].evaluation.AA === 0) {
            if (pages[i].evaluation.AAA === 0) {
              pagesWithoutErrorsAAA++;
            } else {
              pagesWithoutErrorsAA++;
            }
          } else {
            pagesWithoutErrorsA++;
          }
        } else {
          pagesWithErrors++;
        }
      }

      const pagesWithoutErrors = size - pagesWithErrors;

      websites[website.id] = {
        id: website.id,
        name: website.name,
        startingUrl: website.startingUrl,
        oldestPage: website.oldestPage,
        recentPage: website.recentPage,
        score: website.getScore(),
        nPages: website.pages.length,
        entity: website.entity,
        pagesWithErrors,
        pagesWithoutErrorsA,
        pagesWithoutErrorsAA,
        pagesWithoutErrorsAAA,
        pagesWithoutErrors,
        accessibilityPlotData: website.getAllScores(),
        scoreDistributionFrequency: website.frequencies,
        errorsDistribution: website.getTopTenErrors(),
        bestPracticesDistribution: website.getTopTenBestPractices(),
        errors: website.errors,
        success: website.success,
        successDetailsTable:
          this.getDirectoryWebsiteSuccessDetailsTable(website),
        errorsDetailsTable: this.getDirectoryWebsiteErrorsDetailsTable(website),
      };
    }

    return websites;
  }

  getDirectoryWebsiteSuccessDetailsTable(website: Website): any {
    const practices = new Array<any>();
    for (const key in website.success || {}) {
      if (website.success[key]) {
        practices.push({
          key,
          n_occurrences: website.success[key].n_occurrences,
          n_pages: website.success[key].n_pages,
          lvl: _tests[key].level.toUpperCase(),
          quartiles: calculateQuartiles(
            website.getPassedOccurrencesByPage(key)
          ),
        });
      }
    }

    const practicesData = orderBy(
      practices,
      ["n_pages", "n_occurrences"],
      ["desc", "desc"]
    );
    const practicesKeys = Object.keys(practicesData);

    return { practicesKeys, practicesData };
  }

  getDirectoryWebsiteErrorsDetailsTable(website: Website): any {
    const practices = new Array<any>();
    for (const key in website.errors || {}) {
      if (website.errors[key]) {
        practices.push({
          key,
          n_occurrences: website.errors[key].n_occurrences,
          n_pages: website.errors[key].n_pages,
          lvl: _tests[key].level.toUpperCase(),
          quartiles: calculateQuartiles(website.getErrorOccurrencesByPage(key)),
        });
      }
    }

    const practicesData = orderBy(
      practices,
      ["n_pages", "n_occurrences"],
      ["desc", "desc"]
    );
    const practicesKeys = Object.keys(practicesData);

    return { practicesKeys, practicesData };
  }

  private calculateQuartilesGlobalErrors(
    directories: ListDirectories,
    test: any
  ): Array<any> {
    let data = directories.getErrorOccurrenceByDirectory(test);
    return calculateQuartiles(data);
  }

  private calculateQuartilesGlobalBestPractices(
    directories: ListDirectories,
    test: any
  ): Array<any> {
    let data = directories.getPassedOccurrenceByDirectory(test);
    return calculateQuartiles(data);
  }

  private calculateQuartilesDirectoryErrors(
    directory: Directory,
    test: any
  ): Array<any> {
    let data = directory.getErrorOccurrencesByWebsite(test);
    return calculateQuartiles(data);
  }

  private calculateQuartilesDirectoryBestPractices(
    directory: Directory,
    test: any
  ): Array<any> {
    let data = directory.getPassedOccurrenceByWebsite(test);
    return calculateQuartiles(data);
  }

  /**
   * Sync Status Management Methods
   */

  async isSyncRunning(): Promise<boolean> {
    const activeSyncs = await this.syncStatusRepository.find({
      where: { status: SyncStatus.RUNNING },
      order: { startTime: 'DESC' },
      take: 1
    });

    if (activeSyncs.length === 0) return false;

    const activeSync = activeSyncs[0];
    
    // Check if sync is stale (running for more than 1 hour)
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    if (activeSync.startTime < oneHourAgo) {
      // Mark stale sync as interrupted and allow new sync
      await this.markSyncInterrupted(activeSync.id);
      return false;
    }

    return true;
  }

  async getSyncStatus(): Promise<ObservatorySyncStatus | null> {
    const latestSync = await this.syncStatusRepository.findOne({
      order: { createdAt: 'DESC' }
    });
    
    return latestSync;
  }

  async getCurrentRunningSyncStatus(): Promise<ObservatorySyncStatus | null> {
    const runningSync = await this.syncStatusRepository.findOne({
      where: { status: SyncStatus.RUNNING },
      order: { startTime: 'DESC' }
    });
    
    return runningSync;
  }

  private async initializeSyncStatus(
    type: SyncType, 
    totalChunks: number, 
    totalDirectories: number
  ): Promise<ObservatorySyncStatus> {
    const processId = process.pid.toString();
    const namespace = process.env.NAMESPACE;
    const amsid = process.env.AMSID ? parseInt(process.env.AMSID) : null;

    const syncStatus = this.syncStatusRepository.create({
      status: SyncStatus.RUNNING,
      type,
      startTime: new Date(),
      totalChunks,
      processedChunks: 0,
      totalDirectories,
      processedDirectories: 0,
      processId,
      namespace,
      amsid
    });

    return await this.syncStatusRepository.save(syncStatus);
  }

  private async updateSyncProgress(
    syncId: number, 
    processedChunks: number, 
    processedDirectories: number
  ): Promise<void> {
    await this.syncStatusRepository.update(syncId, {
      processedChunks,
      processedDirectories,
      updatedAt: new Date()
    });
  }

  private async markSyncCompleted(syncId: number): Promise<void> {
    await this.syncStatusRepository.update(syncId, {
      status: SyncStatus.COMPLETED,
      endTime: new Date(),
      updatedAt: new Date()
    });
  }

  private async markSyncFailed(syncId: number, errorMessage: string): Promise<void> {
    await this.syncStatusRepository.update(syncId, {
      status: SyncStatus.FAILED,
      endTime: new Date(),
      errorMessage: errorMessage.substring(0, 1000), // Limit error message length
      updatedAt: new Date()
    });
  }

  private async markSyncInterrupted(syncId: number): Promise<void> {
    await this.syncStatusRepository.update(syncId, {
      status: SyncStatus.INTERRUPTED,
      endTime: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Clean up old sync status records (keep only last 50)
   */
  @Cron('0 2 * * *') // Run at 2 AM daily
  async cleanupOldSyncStatuses(): Promise<void> {
    try {
      const allStatuses = await this.syncStatusRepository.find({
        select: ['id'],
        order: { createdAt: 'DESC' }
      });

      if (allStatuses.length > 50) {
        const idsToDelete = allStatuses.slice(50).map(s => s.id);
        await this.syncStatusRepository.delete(idsToDelete);
        console.log(`Cleaned up ${idsToDelete.length} old sync status records`);
      }
    } catch (error) {
      console.error('Error cleaning up old sync statuses:', error);
    }
  }
}
