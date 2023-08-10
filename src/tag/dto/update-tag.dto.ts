import { PartialType } from "@nestjs/mapped-types";
import { CreateTagDto } from "./create-tag.dto";

export class UpdateTagDto extends PartialType(CreateTagDto) {
    defaultDirectories: number[];
    defaultWebsites: number[];
    tagId:number;
}