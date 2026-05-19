cấu trúc code phải luôn tuân thủ nguyên tắc #file:../docs/modular-monolith.md
chỗ try catch ỏ phần catch phải có theo this.logger.error(`Failed to <operation> user`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(`Failed to <operation> user`);

---
