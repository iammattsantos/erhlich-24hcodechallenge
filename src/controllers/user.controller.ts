/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  getModelSchemaRef,
  HttpErrors, patch, post, requestBody,
  response,
  Response,
  RestBindings
} from '@loopback/rest';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import {Token, User} from '../models';
import {TokenRepository, UserRepository} from '../repositories';
import {validateEmail, validatePassword} from '../utils/input-validations.utils';
dotenv.config();

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(TokenRepository)
    public tokenRepository: TokenRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
  ) {}

  @post('/user/register')
  @response(201, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User),
      },
    },
  })
  async register(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<object> {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: user.email,
      },
    });
    const emailValidation = validateEmail(user.email, !!existingUser);
    if (emailValidation.statusCode && emailValidation.validationMsg) {
      throw new HttpErrors[emailValidation.statusCode](emailValidation.validationMsg);
    }

    const pwdValidationMsg = validatePassword(user.password);
    if (pwdValidationMsg) {
      throw new HttpErrors.UnprocessableEntity(pwdValidationMsg);
    }

    const hash = await bcrypt.hash(user.password, 10);
    await this.userRepository.create({
      ...user,
      password: hash,
    });

    return this.httpResponse.status(201).send({
      success: true,
      message: 'New user successfully registered.',
    });
  }

  @post('/user/authenticate')
  @response(201, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User),
      },
    },
  })
  async authenticate(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User),
        },
      },
    })
    user: User,
  ): Promise<object> {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: user.email,
      },
    });
    if (existingUser) {
      const isAuthenticated = await bcrypt.compare(user.password, existingUser.password);
      if (isAuthenticated) {
        const token = jwt.sign({
          id: existingUser.id,
        }, process.env.JWT_SECRET ?? '');

        return this.httpResponse.status(201).send({
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          token
        });
      }
    }

    throw new HttpErrors.Unauthorized('Invalid credentials.');
  }

  @post('/user/password-reset/request')
  async requestPasswordReset(
    @requestBody() request: any,
  ): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: request.email,
      },
    });
    if (!existingUser) {
      throw new HttpErrors.NotFound('User not found.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(resetToken, 10);
    await this.tokenRepository.create(new Token({
      userId: existingUser.id,
      token: hash,
      createdAt: new Date().toISOString(),
    }));

    const sendgridMail = require('@sendgrid/mail');
    sendgridMail.setApiKey(process.env.SENDGRID_APIKEY ?? '');

    const emailRequest = {
      to: existingUser.email,
      from: 'edmatthewsantos@gmail.com',
      subject: 'Password Reset Request',
      text: hash,
      html: `<strong>${hash}</strong>`,
    };
    sendgridMail
      .send(emailRequest)
      .then((res: any) => {
        console.log(res[0].statusCode);
      })
      .catch((err: any) => {
        console.log(err);
        throw new HttpErrors.FailedDependency('Error sending email.')
      });
  }

  @patch('/user/password-reset/process')
  @response(204, {
    description: 'Password PATCH success',
  })
  async processPasswordReset(
    @requestBody() reset: any,
  ): Promise<object> {
    const existingToken = await this.tokenRepository.findOne({
      where: {
        token: reset.token,
      },
    });
    if (!existingToken) {
      throw new HttpErrors.NotFound('Reset token not found.');
    }

    const isTokenValid = reset.token === existingToken.token;
    if (isTokenValid) {
      const hash = await bcrypt.hash(reset.password, 10);
      const user = await this.userRepository.findById(existingToken.userId);
      await this.userRepository.updateById(user.id, {
        password: hash
      });

      return this.httpResponse.status(204).send({
        success: true,
        message: 'Password successfully reset.',
      });
    } else {
      throw new HttpErrors.BadRequest('Token does not match.');
    }
  }
}
