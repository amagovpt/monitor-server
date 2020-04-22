module.exports = {
  apps : [{
    name: 'monitor-server',
    script: './dist/main.js',
    instances  : -2,
    exec_mode  : 'cluster',
    env: {
      PORT: 3000,
      NODE_ENV: 'development',
    },
    env_production: {
      PORT: 3000,
      NODE_ENV: 'production',
    }
  },
  {
    name: 'monitor-server',
    namespace: 'amp',
    script: './dist/main.js',
    instances  : 2,
    exec_mode  : 'cluster',
    env: {
      NAMESPACE: 'AMP',
      PORT: 3001,
      NODE_ENV: 'development',
    },
    env_production: {
      NAMESPACE: 'AMP',
      PORT: 3001,
      NODE_ENV: 'production',
    }
  }]
}