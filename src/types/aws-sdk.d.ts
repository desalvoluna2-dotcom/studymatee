declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config: any): void;
    send(command: any): Promise<any>;
  }
  export class PutObjectCommand {
    constructor(input: any): void;
  }
  export class GetObjectCommand {
    constructor(input: any): void;
  }
  export class DeleteObjectCommand {
    constructor(input: any): void;
  }
}

declare module "@aws-sdk/s3-request-presigner" {
  export function getSignedUrl(client: any, command: any, options?: any): Promise<string>;
}
