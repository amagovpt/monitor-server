import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccessibilityStatement } from "../accessibility-statement/entities/accessibility-statement.entity";
import { CreateContactDto } from "./dto/create-contact.dto";
import { Contact } from "./entities/contact.entity";

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>
  ) {}

  create(
    createContactDto: CreateContactDto,
    acessiblityStatement: AccessibilityStatement
  ) {
    const contact = this.contactRepository.create({
      ...createContactDto,
      acessiblityStatement,
    });
    return this.contactRepository.save(contact);
  }

  getContactsByWebsite() {
    this.contactRepository.query(
      `select 
        w.Name, 
        c.* 
      from 
        Contact as c 
        join Accessibility_Statement as st on st.Id = c.Accessibility_Statement_Id 
        join Website as w on w.WebsiteId = st.WebsiteId 
      where 
        c.Contact is not null`
    );
  }
}
