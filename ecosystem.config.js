module.exports = {
  apps : [{
    name: 'monitor-server',
    namespace: 'global',
    script: './dist/main.js',
    instances  : -2,
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
    instances  : 'max',
    exec_mode  : 'cluster',
    increment_var : 'ID',
    env: {
      NAMESPACE: 'AMP',
      ID: 0,
      PORT: 3001,
      NODE_ENV: 'development',
    },
    env_production: {
      NAMESPACE: 'AMP',
      ID: 0,
      PORT: 3001,
      NODE_ENV: 'production',
    }
  }]
}