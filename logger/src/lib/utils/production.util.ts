import { createGCPLogger } from '../config/gcp.config';
import { CloudService } from '../enums/cloud-service.enums';

export function createProductionLogger(cloudService: CloudService) {
  switch (cloudService) {
    case CloudService.GCP:
      return createGCPLogger();
    case CloudService.AWS:
    case CloudService.AZURE:
    default:
      throw new Error(`Cloud service ${cloudService} is not supported.`);
  }
}
