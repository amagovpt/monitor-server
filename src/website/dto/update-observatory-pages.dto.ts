import { IsNotEmpty } from "class-validator";
export class UpdateObservatoryPages {
  @IsNotEmpty()
  pages: ObservatoryPage[];
}

export class ObservatoryPage {
  id: number;
  inObservatory: boolean;
}
