from pydantic import BaseModel, EmailStr,Field,ConfigDict


# Used as the request body schema for `/auth/register` in `auth_routes.register`.
class UserRegister(BaseModel):

    name: str
    email: EmailStr
    password: str = Field(min_length=3, max_length=72)


# Used as the request body schema for `/auth/login` in `auth_routes.login`
# (via `OAuth2PasswordRequestForm` when using form data).
class UserLogin(BaseModel):

    email: EmailStr
    password: str = Field(min_length=3, max_length=72)



# Used as the response model for `/auth/register` in `auth_routes.register`
# and for returning the current user from `/auth/me`.
class UserResponse(BaseModel):

    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

