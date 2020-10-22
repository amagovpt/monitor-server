module.exports = {
  apps : [{
    name: 'monitor-server',
    namespace: 'global',
    script: './dist/main.js',
    instances  : 6,
    exec_mode  : 'cluster',
    increment_var : 'ID',
    env: {
      NAMESPACE: 'GLOBAL',
      ID: 0,
      PORT: 3000,
      NODE_ENV: 'development',
    },
    env_production: {
      NAMESPACE: 'GLOBAL',
      ID: 0,
      PORT: 3000,
      NODE_ENV: 'production',
    }
  },
  {
    name: 'monitor-server',
    namespace: 'amp',
    script: './dist/main.js',
    instances  : 4,
    exec_mode  : 'cluster',
    increment_var : 'ID2',
    env: {
      NAMESPACE: 'AMP',
      ID2: 0,
      PORT: 3001,
      NODE_ENV: 'development',
    },
    env_production: {
      NAMESPACE: 'AMP',
      ID2: 0,
      PORT: 3001,
      NODE_ENV: 'production',
    }
  }]
}