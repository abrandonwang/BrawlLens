module.exports = {
  apps: [
    {
      name: "brawllens-collector",
      script: "npx",
      args: "tsx scripts/collect-battles.ts",
      cwd: __dirname,
      interpreter: "none",
      restart_delay: 5000,
      max_restarts: 50,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/collector-error.log",
      out_file: "logs/collector-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
