import { RESOURCE_TYPES } from '../config/constants';
import type { ResourceType } from '../interfaces/resource-type';

const RESOURCE_TYPE_SET: ReadonlySet<string> = new Set(RESOURCE_TYPES);

export const isResourceType = (value: string): value is ResourceType =>
  RESOURCE_TYPE_SET.has(value);
