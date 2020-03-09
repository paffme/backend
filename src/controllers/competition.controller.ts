import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {Competition} from '../models';
import {CompetitionRepository} from '../repositories';

export class CompetitionController {
  constructor(
    @repository(CompetitionRepository)
    public competitionRepository : CompetitionRepository,
  ) {}

  @post('/competitions', {
    responses: {
      '200': {
        description: 'Competition model instance',
        content: {'application/json': {schema: getModelSchemaRef(Competition)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Competition, {
            title: 'NewCompetition',
            exclude: ['id'],
          }),
        },
      },
    })
    competition: Omit<Competition, 'id'>,
  ): Promise<Competition> {
    return this.competitionRepository.create(competition);
  }

  @get('/competitions/count', {
    responses: {
      '200': {
        description: 'Competition model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Competition) where?: Where<Competition>,
  ): Promise<Count> {
    return this.competitionRepository.count(where);
  }

  @get('/competitions', {
    responses: {
      '200': {
        description: 'Array of Competition model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Competition, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Competition) filter?: Filter<Competition>,
  ): Promise<Competition[]> {
    return this.competitionRepository.find(filter);
  }

  @patch('/competitions', {
    responses: {
      '200': {
        description: 'Competition PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Competition, {partial: true}),
        },
      },
    })
    competition: Competition,
    @param.where(Competition) where?: Where<Competition>,
  ): Promise<Count> {
    return this.competitionRepository.updateAll(competition, where);
  }

  @get('/competitions/{id}', {
    responses: {
      '200': {
        description: 'Competition model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Competition, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Competition, {exclude: 'where'}) filter?: FilterExcludingWhere<Competition>
  ): Promise<Competition> {
    return this.competitionRepository.findById(id, filter);
  }

  @patch('/competitions/{id}', {
    responses: {
      '204': {
        description: 'Competition PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Competition, {partial: true}),
        },
      },
    })
    competition: Competition,
  ): Promise<void> {
    await this.competitionRepository.updateById(id, competition);
  }

  @put('/competitions/{id}', {
    responses: {
      '204': {
        description: 'Competition PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() competition: Competition,
  ): Promise<void> {
    await this.competitionRepository.replaceById(id, competition);
  }

  @del('/competitions/{id}', {
    responses: {
      '204': {
        description: 'Competition DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.competitionRepository.deleteById(id);
  }
}
