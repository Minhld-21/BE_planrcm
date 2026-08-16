import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async createPlan({ goal, context }: CreatePlanDto) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const modelName =
      this.config.get<string>('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY chưa được cấu hình. Hãy thêm khóa vào tệp .env của backend.',
      );
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: modelName });
    const prompt = [
      'Bạn là trợ lý lập kế hoạch. Trả lời bằng tiếng Việt.',
      'Hãy đưa ra một kế hoạch thực tế, có các mốc theo thứ tự, kết quả mong đợi và rủi ro chính.',
      `Mục tiêu: ${goal}`,
      context ? `Bối cảnh bổ sung: ${context}` : undefined,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const result = await model.generateContent(prompt);
      return { model: modelName, text: result.response.text() };
    } catch {
      throw new ServiceUnavailableException(
        'Không thể kết nối Gemini. Hãy kiểm tra GEMINI_API_KEY và model đã cấu hình.',
      );
    }
  }
}
