export interface S3PermissionInfo {
  Grants: GrantInfo[];
  Owner: OwnerInfo;
}

export interface GrantInfo {
  Grantee: GranteeInfo;
  Permission: string;
}

export interface GranteeInfo {
  DisplayName: string;
  ID: string;
  Type: string;
}

export interface OwnerInfo {
  DisplayName: string;
  ID: string;
}
