
keep this in crontab
PATH=/usr/bin:/bin:/usr/local/bin #might be necessary to access node (or nodejs)
* * * * * node /pathto/cron.js >/somelogpath/.cronlog 2>&1




Usage

cron.js keeps track of running node processes. on first use, it checkes the running tasks and stores
the command to start/restart them is a json file. if cron.js is executed using a cron job, then every time it is run,
it checks to make sure that a matching process is running for each of the stored commands and restarts them if necessary.
