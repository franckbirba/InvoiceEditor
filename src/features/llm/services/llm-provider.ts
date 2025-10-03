import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type LLMProvider = 'anthropic' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM Provider Service
 * Handles API calls to different LLM providers (Anthropic, OpenAI)
 */
export class LLMProviderService {
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;

    if (config.provider === 'anthropic') {
      this.anthropic = new Anthropic({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true, // For browser usage
      });
    } else if (config.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true, // For browser usage
      });
    }
  }

  /**
   * Complete a prompt with the configured LLM
   */
  async complete(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    if (this.config.provider === 'anthropic') {
      return this.completeAnthropic(systemPrompt, userPrompt);
    } else if (this.config.provider === 'openai') {
      return this.completeOpenAI(systemPrompt, userPrompt);
    }

    throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
  }

  /**
   * Anthropic Claude completion
   */
  private async completeAnthropic(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const model = this.config.model || 'claude-3-5-sonnet-20241022';

    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Anthropic response');
    }

    return {
      content: textContent.text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  /**
   * OpenAI completion
   */
  private async completeOpenAI(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const model = this.config.model || 'gpt-4-turbo-preview';

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return {
      content,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }
}
