import { InfluxDB, ISingleHostConfig } from "influx";
import { EventEmitter } from "events";

const PLUGIN_NAME = "influxdb2";

interface InfluxDbReporterConfig {
  plugins: {
    [PLUGIN_NAME]: {
      influx: ISingleHostConfig;
    };
  };
}

export class InfluxDbReporter {
  private reporter: InfluxDB;
  private measurement = "ccxp-load-test";

  constructor(config: InfluxDbReporterConfig, eventEmitter: EventEmitter) {
    if (!config || !config.plugins || !config.plugins[PLUGIN_NAME]) {
      throw new Error("No plugin config found");
    }

    this.createReporter(config);

    eventEmitter.on("stats", this.sendStats.bind(this));
  }

  private createReporter(config: InfluxDbReporterConfig) {
    this.reporter = new InfluxDB(config.plugins[PLUGIN_NAME].influx);
  }

  private async sendStats(stats): Promise<void> {
    const report = stats.report();

    await this.reporter.writePoints([
      {
        measurement: this.measurement,
        fields: {
          scenariosCreated: report.scenariosCreated,
          scenariosCompleted: report.scenariosCompleted,
          requestsCompleted: report.requestsCompleted,
          rps: report.rps.count,
          codes_200: report.codes["200"] || 0,
          codes_400: report.codes["400"] || 0,
          codes_404: report.codes["404"] || 0,
          codes_500: report.codes["500"] || 0,
          codes_502: report.codes["502"] || 0,
          codes_503: report.codes["503"] || 0,
          errors: Object.values(report.errors).reduce(
            (accum: number, curr: number) => accum + curr,
            0
          ),
          concurrency: report.concurrency,
          min: Math.min(...report.latencies) / 1000000,
          max: Math.max(...report.latencies) / 1000000,
          average:
            report.latencies.reduce(
              (accum: number, curr: number) => accum + curr,
              0
            ) /
            report.latencies.length /
            1000000,
        },
      },
    ]);
  }
}
