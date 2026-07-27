import { Request, Response, NextFunction } from 'express';
import { daoService } from '../services/dao.service';
import { sendCreated, sendSuccess } from '../utils/response';

export class DAOController {
  async createProposal(req: Request, res: Response, next: NextFunction) {
    try {
      const proposal = await daoService.createProposal(req.user!.userId, req.body);
      sendCreated(res, proposal);
    } catch (error) {
      next(error);
    }
  }

  async getProposals(req: Request, res: Response, next: NextFunction) {
    try {
      const proposals = await daoService.getProposals(req.query.asset_id as string);
      sendSuccess(res, proposals);
    } catch (error) {
      next(error);
    }
  }

  async castVote(req: Request, res: Response, next: NextFunction) {
    try {
      const vote = await daoService.castVote(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      sendCreated(res, vote);
    } catch (error) {
      next(error);
    }
  }
}

export const daoController = new DAOController();
