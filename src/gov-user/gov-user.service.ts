import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { UserService } from "src/user/user.service";
import { Repository } from "typeorm";
import { CreateGovUserDto } from "./dto/create-gov-user.dto";
import { UpdateGovUserDto } from "./dto/update-gov-user.dto";
import { GovUser } from "./entities/gov-user.entity";

@Injectable()
export class GovUserService {
  constructor(
    @InjectRepository(GovUser)
    private govUserRepository: Repository<GovUser>,
    private userService: UserService
  ) {}

  create(createGovUserDto: CreateGovUserDto) {
    return this.addToDB(createGovUserDto);
  }
  addToDB(createGovUserDto: CreateGovUserDto) {
    const newUser = this.govUserRepository.create({
      registerDate: new Date(),
      lastLogin: new Date(),
      ...createGovUserDto,
    });
    return this.govUserRepository.save(newUser);
  }

  async associateUser(user: User, id: number) {
    const govUser = await this.findOne(id);
    govUser.entities.push(user);
    return this.govUserRepository.save(govUser);
  }

  findAll(
    size?: number,
    page?: number,
    sort?: string,
    direction?: string,
    search?: string
  ): Promise<any> {
    // If no pagination parameters provided, return all gov users (existing behavior)
    if (size === undefined) {
      return this.govUserRepository.find({ relations: ["entities"] });
    }

    // Paginated version
    const searchTerm = search?.trim() !== "" ? `%${search?.trim()}%` : "%";
    
    if (!direction?.trim()) {
      // Without sorting
      if (size !== -1) {
        const govUsers = this.govUserRepository.query(
          `SELECT 
            g.id, g.name, g.ccNumber, g.registerDate, g.lastLogin,
            COUNT(DISTINCT ugu.UserId) as Entities
          FROM GovUser as g
          LEFT OUTER JOIN UserGovUser as ugu ON ugu.GovUserId = g.id
          WHERE g.name LIKE ? OR g.ccNumber LIKE ?
          GROUP BY g.id
          LIMIT ? OFFSET ?`,
          [searchTerm, searchTerm, size, page * size]
        );
        return govUsers;
      } else {
        const govUsers = this.govUserRepository.query(
          `SELECT 
            g.id, g.name, g.ccNumber, g.registerDate, g.lastLogin,
            COUNT(DISTINCT ugu.UserId) as Entities
          FROM GovUser as g
          LEFT OUTER JOIN UserGovUser as ugu ON ugu.GovUserId = g.id
          WHERE g.name LIKE ? OR g.ccNumber LIKE ?
          GROUP BY g.id`,
          [searchTerm, searchTerm]
        );
        return govUsers;
      }
    } else {
      // With sorting
      let order = "";
      switch (sort) {
        case "name":
          order = "g.name";
          break;
        case "ccNumber":
          order = "g.ccNumber";
          break;
        case "registerDate":
          order = "g.registerDate";
          break;
        case "lastLogin":
          order = "g.lastLogin";
          break;
        case "Entities":
          order = "Entities";
          break;
        default:
          order = "g.name";
          break;
      }

      if (size !== -1) {
        const govUsers = this.govUserRepository.query(
          `SELECT 
            g.id, g.name, g.ccNumber, g.registerDate, g.lastLogin,
            COUNT(DISTINCT ugu.UserId) as Entities
          FROM GovUser as g
          LEFT OUTER JOIN UserGovUser as ugu ON ugu.GovUserId = g.id
          WHERE g.name LIKE ? OR g.ccNumber LIKE ?
          GROUP BY g.id
          ORDER BY ${order} ${direction.toUpperCase()}
          LIMIT ? OFFSET ?`,
          [searchTerm, searchTerm, size, page * size]
        );
        return govUsers;
      } else {
        const govUsers = this.govUserRepository.query(
          `SELECT 
            g.id, g.name, g.ccNumber, g.registerDate, g.lastLogin,
            COUNT(DISTINCT ugu.UserId) as Entities
          FROM GovUser as g
          LEFT OUTER JOIN UserGovUser as ugu ON ugu.GovUserId = g.id
          WHERE g.name LIKE ? OR g.ccNumber LIKE ?
          GROUP BY g.id
          ORDER BY ${order} ${direction.toUpperCase()}`,
          [searchTerm, searchTerm]
        );
        return govUsers;
      }
    }
  }

  findOne(id: number) {
    return this.govUserRepository.findOne({
      where: { id },
      relations: ["entities"],
    });
  }

  findOneByCC(ccNumber: string) {
    console.log(ccNumber);
    return this.govUserRepository.findOne({
      where: { ccNumber },
      relations: ["entities"],
    });
  }

  updateLogin(ccNumber: string) {
    return this.govUserRepository.update(
      { ccNumber },
      { lastLogin: new Date() }
    );
  }

  async checkIfExists(ccNumber: string) {
    const user = await this.findOneByCC(ccNumber);
    return user;
  }

  async update(updateGovUserDto: UpdateGovUserDto) {
    const users = updateGovUserDto.entities;
    const entities = await Promise.all(
      users.map(async (user) => {
        return this.userService.findById(user.UserId + "");
      })
    );
    return this.govUserRepository.save({ entities, ...updateGovUserDto });
  }

  remove(id: number) {
    return this.govUserRepository.delete(id);
  }

  async findTotal(): Promise<number> {
    return this.govUserRepository.count();
  }

  async adminCount(search: string): Promise<any> {
    const count = await this.govUserRepository.query(
      `SELECT COUNT(g.id) as Count
      FROM GovUser as g
      WHERE g.ccNumber LIKE ? OR g.firstName LIKE ? OR g.lastName LIKE ? OR g.email LIKE ?`,
      [
        search.trim() !== "" ? `%${search.trim()}%` : "%",
        search.trim() !== "" ? `%${search.trim()}%` : "%",
        search.trim() !== "" ? `%${search.trim()}%` : "%",
        search.trim() !== "" ? `%${search.trim()}%` : "%"
      ]
    );
    return count[0].Count;
  }

}
