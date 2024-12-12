module.exports = {
  apps: [
    {
      name: "monitor-server",
      namespace: "amp",
      script: "./dist/main.js",
      instances: 3,
      cron_restart: "0 */2 * * *",
      exec_mode: "cluster",
      increment_var: "AMPID",
      env: {
        NAMESPACE: "AMP",
        AMPID: 0,
        PORT: 3000,
        NODE_ENV: "development",
        VALIDATOR: "http://10.100.45.7/validate/",
        REFERER: "https://accessmonitor.acessibilidade.gov.pt/",
        CLIENT_ID: "8034387266539447728",
        REDIRECT_URI: "https://mymonitor.acessibilidade.gov.pt/mm/loginRedirect",
        SECRET_KEY: "vtUfe9I6Tc",
      },
      env_production: {
        NAMESPACE: "AMP",
        AMPID: 0,
        PORT: 3000,
        NODE_ENV: "production",
        VALIDATOR: "http://10.100.45.7/validate/",
        REFERER: "https://accessmonitor.acessibilidade.gov.pt/",
        CLIENT_ID: "8034387266539447728",
        REDIRECT_URI: "https://mymonitor.acessibilidade.gov.pt/mm/loginRedirect",
        SECRET_KEY: "vtUfe9I6Tc",
      },
    },
    {
      name: "monitor-server",
      namespace: "admin",
      script: "./dist/main.js",
      instances: 3,
      cron_restart: "0 */2 * * *",
      exec_mode: "cluster",
      increment_var: "AMSID",
      env: {
        NAMESPACE: "ADMIN",
        AMSID: 0,
        PORT: 3000,
        NODE_ENV: "development",
        VALIDATOR: "http://10.100.45.7/validate/",
        REFERER: "https://accessmonitor.acessibilidade.gov.pt/",
        CLIENT_ID: "8034387266539447728",
        REDIRECT_URI: "https://mymonitor.acessibilidade.gov.pt/mm/loginRedirect",
        SECRET_KEY: "vtUfe9I6Tc",
      },
      env_production: {
        NAMESPACE: "ADMIN",
        AMSID: 0,
        PORT: 3000,
        NODE_ENV: "production",
        VALIDATOR: "http://10.100.45.7/validate/",
        REFERER: "https://accessmonitor.acessibilidade.gov.pt/",
        CLIENT_ID: "8034387266539447728",
        REDIRECT_URI: "https://mymonitor.acessibilidade.gov.pt/mm/loginRedirect",
        SECRET_KEY: "vtUfe9I6Tc",
      },
    },
    {
      name: "monitor-server",
      namespace: "user",
      script: "./dist/main.js",
      instances: 3,
      cron_restart: "0 */2 * * *",
      exec_mode: "cluster",
      increment_var: "USRID",
      env: {
        NAMESPACE: "USER",
        USRID: 0,
        PORT: 3000,
        NODE_ENV: "development",
        VALIDATOR: "http://10.100.45.7/validate/",
        REFERER: "https://accessmonitor.acessibilidade.gov.pt/",
        CLIENT_ID: "8034387266539447728",
        REDIRECT_URI: "https://mymonitor.acessibilidade.gov.pt/mm/loginRedirect",
        SECRET_KEY: "vtUfe9I6Tc",
      },
      env_production: {
        NAMESPACE: "USER",
        USRID: 0,
        PORT: 3000,
        NODE_ENV: "production",
        VALIDATOR: "http://10.100.45.7/validate/",
        REFERER: "https://accessmonitor.acessibilidade.gov.pt/",
        CLIENT_ID: "8034387266539447728",
        REDIRECT_URI: "https://mymonitor.acessibilidade.gov.pt/mm/loginRedirect",
        SECRET_KEY: "vtUfe9I6Tc",
      },
    },
  ],
};

