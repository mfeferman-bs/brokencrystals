import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Product } from '../model/product.entity';

@Injectable()
export class ProductsService {
  private readonly MAX_LIMIT = 5;
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: EntityRepository<Product>,
    private readonly em: EntityManager,
  ) {}

  async findAll(): Promise<Product[]> {
    this.logger.debug(`Find all products`);
    return this.productsRepository.findAll();
  }

  async findLatest(limit: number): Promise<Product[]> {
    this.logger.debug(`Find ${limit} latest products`);
    return this.productsRepository.find({},{limit: limit});
  }
}