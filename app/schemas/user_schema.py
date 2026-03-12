from pydantic import BaseModel, EmailStr,Field,ConfigDict


class UserRegister(BaseModel):

    name: str
    email: EmailStr
    password: str = Field(min_length=3, max_length=72)


class UserLogin(BaseModel):

    email: EmailStr
    password: str = Field(min_length=3, max_length=72)



class UserResponse(BaseModel):

    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

