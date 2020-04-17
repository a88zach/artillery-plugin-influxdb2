import { InfluxDbReporter } from "./influxdb";

module.exports = function (config, eventEmitter) {
  return new InfluxDbReporter(config, eventEmitter);
};
