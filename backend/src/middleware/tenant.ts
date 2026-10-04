import { Request, Response, NextFunction } from "express";

export interface TenantRequest extends Request {
  tenantId?: string;
  collegeContext?: any;
}

export async function tenantHandler(req: TenantRequest, res: Response, next: NextFunction): Promise<void> {
  // Multi-tenant header validation pass-through
  next();
}
