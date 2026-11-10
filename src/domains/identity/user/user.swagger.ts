import { applyDecorators, HttpCode, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { UserDTO } from "./dto/user.dto";
import { UserQueryDTO } from "./dto/request/user-request.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateMeDTO } from "./dto/update-user-me.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserPaginationResponse } from "./dto/pagination-response.dto";

export const UserDocs = {
  controller: applyDecorators(
    ApiTags("user"),
    ApiBasicAuth(),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized - Missing or invalid authentication token." }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Insufficient permissions." }),
  ),

  create: applyDecorators(
    ApiOperation({ summary: "Create a new user" }),
    ApiBody({ type: CreateUserDto, description: "Payload for creating a new user" }),
    ApiResponse({ status: HttpStatus.CREATED, description: "User successfully created.", type: UserDTO }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data or role assignment issues." }),
    HttpCode(HttpStatus.CREATED)  
  ),

  update: applyDecorators(
    ApiOperation({ summary: "Update an existing user by ID" ,
      description: " For administrators: Update any user's details such as names, email, role, and citizen card number. Provide the user ID in the path and the updated fields in the request body. For monitors and study roles: Update their own profile details such as names, email, and citizen card number. The role field will be ignored for these roles. Provide the updated fields in the request body without the need for a user ID in the path." }),
    ApiBody({ type: UpdateUserDto, description: "Payload for updating user details" }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data or role assignment issues." }),
    ApiResponse({ status: HttpStatus.OK, description: "The user was successfully updated.", type: UserDTO }),
    HttpCode(HttpStatus.OK)
  ),


  updateMe: applyDecorators(
    ApiOperation({ summary: "Update current authenticated user profile" 
      , description: "Allows current user to update personal details and change passwords."
    }),
    ApiBody({ type: UpdateMeDTO, description: "Payload for updating user profile details" }),
    ApiResponse({ status: HttpStatus.OK, description: "Profile successfully updated.", type: UserDTO }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data or password change requirements not met." }),
    HttpCode(HttpStatus.OK)
  ),

  delete: applyDecorators(
    ApiOperation({ summary: "Soft delete or remove a user from the system" }),
    ApiParam({ name: "id", description: "Unique identifier of the user to be deleted", type: Number }),
     ApiResponse({ status: HttpStatus.NOT_FOUND, description: "User not found." }),
     ApiResponse({ status: HttpStatus.NO_CONTENT, description: "User successfully removed. No content returned." }),
     HttpCode(HttpStatus.NO_CONTENT) 
  ),
  

  getUser: applyDecorators(
    ApiOperation({ summary: "Retrieve a specific user by their unique ID" }),
    ApiParam({ name: "id", description: "Unique identifier of the user", type: Number, required: true }),
    ApiResponse({ status: HttpStatus.OK, description: "User found.", type: UserDTO }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid user ID." }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: "User not found." })
  ),

  findAll: applyDecorators(
    ApiOperation({ summary: "Find all users with pagination and filters" }),
    ApiQuery({ type: UserQueryDTO }),
    ApiResponse({ status: HttpStatus.OK, description: "Paginated list retrieved.", type: UserPaginationResponse }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid query parameters." }),
    HttpCode(HttpStatus.OK)
  ),
  recover: applyDecorators(
    ApiOperation({ summary: "Restore a previously deleted user" }),
    ApiParam({ name: "id", description: "Unique identifier of the user to be restored", type: Number }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: "User not found." }),
    ApiResponse({ status: HttpStatus.NO_CONTENT, description: "User successfully restored. No content returned." }),
    HttpCode(HttpStatus.NO_CONTENT) 
  ),

};
