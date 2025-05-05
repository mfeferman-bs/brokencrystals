import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Put,
  Query,
  Res
} from '@nestjs/common';
import {
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { W_OK } from 'constants';
import * as fs from 'fs';
import * as path from 'path';
import { Stream } from 'stream';
import { FileService } from './file.service';
import { FastifyReply } from 'fastify';
import {
  SWAGGER_DESC_DELETE_FILE,
  SWAGGER_DESC_READ_FILE,
  SWAGGER_DESC_READ_FILE_ON_SERVER,
  SWAGGER_DESC_SAVE_RAW_CONTENT
} from './file.controller.swagger.desc';
import { CloudProvidersMetaData } from './cloud.providers.metadata';

@Controller('/api/file')
@ApiTags('Files controller')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private fileService: FileService) {}

  private getContentType(contentType: string) {
    if (contentType) {
      return contentType;
    } else {
      return 'application/octet-stream';
    }
  }

  private async loadCPFile(cpBaseUrl: string, path: string) {
    if (!path.startsWith(cpBaseUrl)) {
      throw new BadRequestException(`Invalid parameter 'path'`);
    }

    const file: Stream = await this.fileService.getFile(path);

    return file;
  }

  private isValidPath(filePath: string): boolean {
    // Implement a whitelist of allowed paths or patterns
    const allowedPaths = [
      'config/products/crystals/',
      // Add more allowed paths or patterns here
    ];
    return allowedPaths.some(allowedPath => filePath.startsWith(allowedPath));
  }

  private isValidUrl(url: string): boolean {
    // Implement a whitelist of allowed base URLs
    const allowedUrls = [
      CloudProvidersMetaData.AZURE,
      // Add more allowed base URLs here
    ];
    return allowedUrls.some(allowedUrl => url.startsWith(allowedUrl));
  }

  @Get('/digital_ocean')
  @ApiQuery({
    name: 'path',
    example: 'http://169.254.169.254/metadata/v1/user-data',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadDigitalOceanFile(
    @Query('path') filePath: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidPath(filePath)) {
      throw new BadRequestException('Invalid file path');
    }

    try {
      const file: Stream = await this.fileService.getFile(filePath);
      const type = this.getContentType(contentType);
      res.type(type);

      return file;
    } catch (error) {
      this.logger.error('Error loading file', error.stack);
      throw new BadRequestException('Unable to load file');
    }
  }

  // Other methods remain unchanged
}
