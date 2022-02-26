import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import dotenv from 'dotenv';
dotenv.config();

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class DbDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'mongodb';
  static readonly defaultConfig = process.env.DATASOURCES_MONGODB;

  constructor(
    @inject('datasources.config.mongodb', {optional: true})
    dsConfig: object = JSON.parse(process.env.DATASOURCES_MONGODB ?? ''),
  ) {
    super(dsConfig);
  }
}
