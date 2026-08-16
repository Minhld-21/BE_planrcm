import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Health endpoint (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok' });
  });

  it('/api/v1/itinerary/generate (POST) rejects invalid coordinates', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/itinerary/generate')
      .send({ lat: 91, lng: 106.7009 })
      .expect(400);

    expect(response.text).toContain('lat must not be greater than 90');
  });

  it('/api/v1/itinerary/generate (POST) requires a destination or current coordinates', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/itinerary/generate')
      .send({ packages: ['foodie'] })
      .expect(400);

    expect(response.text).toContain('lat must be a number');
  });

  it('/api/v1/maps/places/autocomplete (GET) validates a Gemini place query', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/maps/places/autocomplete?input=Đà')
      .expect(400);

    expect(response.text).toContain('input must be longer than or equal to 3');
  });

  it('does not rate limit endpoints that do not call Gemini', async () => {
    for (let requestCount = 0; requestCount < 6; requestCount += 1) {
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    }
  });
});
