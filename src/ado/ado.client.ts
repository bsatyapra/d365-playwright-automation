import * as azdev from 'azure-devops-node-api';
import type { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces';
import { config } from '../config/env';

let _connection: azdev.WebApi | null = null;

function getConnection(): azdev.WebApi {
  if (!_connection) {
    const authHandler: IRequestHandler = azdev.getPersonalAccessTokenHandler(config.adoPat);
    _connection = new azdev.WebApi(config.adoOrgUrl, authHandler);
  }
  return _connection;
}

export async function getTestPlanApi() {
  return getConnection().getTestPlanApi();
}

export async function getTestApi() {
  return getConnection().getTestApi();
}

export async function getWitApi() {
  return getConnection().getWorkItemTrackingApi();
}
