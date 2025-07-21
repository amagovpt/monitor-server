-- Performance Optimization Indexes for Observatory Data Generation
-- These indexes optimize the main queries in ObservatoryService.getData()

-- 1. Optimize Evaluation queries with latest evaluation_date subquery
-- Current bottleneck: subquery in LEFT OUTER JOIN for latest evaluation
CREATE INDEX idx_evaluation_page_show_date ON Evaluation (PageId, Show_To, Evaluation_Date DESC);

-- 2. Optimize EntityWebsite lookup (N+1 query fix)
-- Current bottleneck: individual queries for each WebsiteId in the entity lookup
CREATE INDEX idx_entitywebsite_website ON EntityWebsite (WebsiteId);

-- 3. Optimize TagWebsite junction table queries  
-- Used in both directory methods (Method 0 and Method 1)
CREATE INDEX idx_tagwebsite_tag ON TagWebsite (TagId);
CREATE INDEX idx_tagwebsite_website ON TagWebsite (WebsiteId);

-- 4. Optimize DirectoryTag junction table
-- Used to get tags for each directory
CREATE INDEX idx_directorytag_directory ON DirectoryTag (DirectoryId);

-- 5. Optimize Page filtering by Show_In
-- Used in WHERE clause: p.Show_In LIKE "__1"
CREATE INDEX idx_page_show_in ON Page (Show_In);

-- 6. Optimize WebsitePage junction table
-- Used in multiple joins
CREATE INDEX idx_websitepage_website ON WebsitePage (WebsiteId);
CREATE INDEX idx_websitepage_page ON WebsitePage (PageId);

-- 7. Composite index for Directory observatory filtering
-- Used in main directory query: WHERE Show_in_Observatory = 1  
CREATE INDEX idx_directory_observatory ON Directory (Show_in_Observatory, DirectoryId);

-- Verification queries to check index usage:
-- EXPLAIN SELECT ... (add before actual queries to verify index usage)