import { Injectable, Logger } from '@nestjs/common';
import { Readable, Stream } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { CloudProvidersMetaData } from './cloud.providers.metadata';
import { R_OK } from 'constants';
import { URL } from 'url';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private cloudProviders = new CloudProvidersMetaData();

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    // Validate the file path to prevent directory traversal
    if (!this.isValidPath(file)) {
      throw new Error('Invalid file path');
    }

    if (file.startsWith('/')) {
      const safeBasePath = path.resolve('/safe/base/directory');
      const resolvedPath = path.resolve(safeBasePath, '.' + file);

      if (!resolvedPath.startsWith(safeBasePath)) {
        throw new Error('Invalid file path');
      }

      await fs.promises.access(resolvedPath, R_OK);

      return fs.createReadStream(resolvedPath);
    } else if (file.startsWith('http')) {
      // Validate URL
      const url = new URL(file);
      if (!this.isAllowedHost(url.hostname)) {
        throw new Error('Access to this host is not allowed');
      }

      const content = await this.cloudProviders.get(file);

      if (content) {
        return Readable.from(content);
      } else {
        throw new Error(`no such file or directory, access '${file}'`);
      }
    } else {
      const safeBasePath = path.resolve('/safe/base/directory');
      const resolvedPath = path.resolve(safeBasePath, file);

      if (!resolvedPath.startsWith(safeBasePath)) {
        throw new Error('Invalid file path');
      }

      await fs.promises.access(resolvedPath, R_OK);

      return fs.createReadStream(resolvedPath);
    }
  }

  private isAllowedHost(hostname: string): boolean {
    const allowedHosts = [
      'metadata.google.internal',
      // Add other allowed hosts here
    ];
    return allowedHosts.includes(hostname);
  }

  private isValidPath(filePath: string): boolean {
    // Prevent directory traversal by checking for '..'
    const resolvedPath = path.resolve(filePath);
    return !resolvedPath.includes('..');
  }

  async deleteFile(file: string): Promise<boolean> {
    if (file.startsWith('/')) {
      throw new Error('cannot delete file from this location');
    } else if (file.startsWith('http')) {
      throw new Error('cannot delete file from this location');
    } else {
      file = path.resolve(process.cwd(), file);
      await fs.promises.unlink(file);
      return true;
    }
  }
}
