# Observatory Performance Configuration

This document describes the environment variables available for configuring the Observatory data generation performance optimizations.

## Phase 1 & Phase 2 Optimizations

### Core Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OBSERVATORY_CHUNK_SIZE` | `10` | Number of directories to process in each chunk. Smaller values use less memory but may take longer. |
| `ENABLE_INCREMENTAL_OBSERVATORY` | `false` | Enable incremental processing - only rebuild directories with changes since last run. |
| `ENABLE_OBSERVATORY_GC` | `false` | Force garbage collection between chunks to manage memory usage. |
| `OBSERVATORY_MAX_MEMORY_MB` | `1024` | Maximum memory usage limit in MB. Process will abort if exceeded. |

### Usage Examples

#### Production Environment (Large Dataset)
```bash
# Use smaller chunks and enable GC for memory-constrained environments
export OBSERVATORY_CHUNK_SIZE=10
export ENABLE_OBSERVATORY_GC=true
export OBSERVATORY_MAX_MEMORY_MB=512
```

#### Development Environment (Faster Processing)
```bash
# Use larger chunks for faster processing when memory is not a concern
export OBSERVATORY_CHUNK_SIZE=50
export ENABLE_INCREMENTAL_OBSERVATORY=true
```

#### Pre-production Environment (Incremental)
```bash
# Enable incremental processing to speed up daily runs
export ENABLE_INCREMENTAL_OBSERVATORY=true
export OBSERVATORY_CHUNK_SIZE=20
```

## Performance Tuning Guidelines

### Chunk Size Selection
- **Small chunks (5-10)**: Best for memory-constrained environments (< 2GB RAM)
- **Medium chunks (15-25)**: Good balance for most production environments  
- **Large chunks (30-50)**: Best for development or high-memory environments (> 8GB RAM)

### Incremental Processing
- **Enable when**: You have daily/regular automated runs
- **Disable when**: Manual runs or when you need guaranteed full data refresh
- **Note**: First run after enabling incremental will still be a full run

### Garbage Collection
- **Enable when**: Running in memory-constrained environments
- **Disable when**: Performance is more important than memory usage
- **Note**: Adds slight processing overhead but prevents memory issues

## Database Indexes

Before enabling these optimizations, ensure the performance indexes are applied:

```sql
-- Apply indexes from performance-indexes.sql
source performance-indexes.sql;
```

## Monitoring

The optimized Observatory service provides console logging for monitoring:

```
Starting chunked data generation with chunk size: 20
Processing 120 directories in chunks of 20
Processing chunk 1/6
Processing chunk 2/6  
...
Forced garbage collection after chunk 3
Chunked data generation completed
```

## Troubleshooting

### Memory Issues
If you still encounter memory issues or SIGABRT crashes:
1. Reduce `OBSERVATORY_CHUNK_SIZE` to 5 (minimum recommended)
2. Enable `ENABLE_OBSERVATORY_GC=true`
3. Lower `OBSERVATORY_MAX_MEMORY_MB` to 512 or 256
4. Run with `--max-old-space-size=2048` Node.js flag
5. Consider running during off-peak hours

### Performance Issues  
If processing is too slow:
1. Increase `OBSERVATORY_CHUNK_SIZE` to 30-50
2. Disable `ENABLE_OBSERVATORY_GC`
3. Ensure database indexes are applied

### Data Inconsistency
If incremental processing misses changes:
1. Run one manual generation: `generateData(true)`
2. Check the change detection queries in `getChangedDirectoryIds()`
3. Temporarily disable incremental processing

## Migration Path

### From Legacy to Optimized
1. **Phase 1**: Apply database indexes
2. **Phase 2**: Enable chunked processing with default settings
3. **Phase 3**: Fine-tune chunk sizes based on your environment
4. **Phase 4**: Enable incremental processing for regular automated runs

The legacy `getDataLegacy()` method is maintained for rollback capability if needed.