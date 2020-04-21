module.exports = {
  apps : [{
    name: "monitor-server",
    script: "./dist/main.js",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    },
    instances  : 2,
    exec_mode  : "cluster"
  }]
}