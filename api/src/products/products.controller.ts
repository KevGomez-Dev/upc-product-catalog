import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import type { AuthenticatedUser } from '../auth/auth.identity';
import { hasValidUpcCheckDigit } from '../catalog/upc';
import { ProductFilterDto, ProductIdDto, ProductWriteDto } from './product.dto';
import { ProductsService } from './products.service';

interface ProductResponse {
  setHeader(name: string, value: string): void;
}

function setUpcWarning(response: ProductResponse, upcCode: string): void {
  if (!hasValidUpcCheckDigit(upcCode))
    response.setHeader('X-UPC-Warning', 'UPC_CHECKSUM');
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @Roles('admin', 'manager')
  list(@Query() filter: ProductFilterDto) {
    return this.products.list(filter);
  }

  @Get(':id')
  @Roles('admin', 'manager')
  detail(@Param() { id }: ProductIdDto) {
    return this.products.detail(Number(id));
  }

  @Post()
  @Roles('admin')
  async create(
    @Body() input: ProductWriteDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) response: ProductResponse,
  ) {
    const product = await this.products.create(input, actor);
    response.setHeader('Location', `/products/${product.id}`);
    setUpcWarning(response, product.upcCode);
    return product;
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param() { id }: ProductIdDto,
    @Body() input: ProductWriteDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) response: ProductResponse,
  ) {
    const product = await this.products.update(Number(id), input, actor);
    setUpcWarning(response, product.upcCode);
    return product;
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  async delete(@Param() { id }: ProductIdDto): Promise<void> {
    await this.products.delete(Number(id));
  }
}
