import { SubCriteriaDTO } from "./sub-criteria.dto";

export class CriteriaDTO {

  id: number;
  title: string;
  subCriteria: SubCriteriaDTO[];
}