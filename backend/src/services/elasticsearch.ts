import { Client } from '@elastic/elasticsearch';
import { config } from '../config/env';

export const esClient = new Client({
  node: config.elasticsearchNode,
});

export const EMAILS_INDEX = 'emails';

export async function initElasticsearchIndex(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: EMAILS_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: EMAILS_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            to: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            senderId: { type: 'keyword' },
            tenantId: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            createdAt: { type: 'date' },
          },
        },
      });
      console.log(`✨ Elasticsearch index '${EMAILS_INDEX}' created successfully.`);
    } else {
      console.log(`⚡ Elasticsearch index '${EMAILS_INDEX}' already exists.`);
    }
  } catch (err: any) {
    console.error('⚠️ Elasticsearch Index Initialization Warning:', err.message || err);
  }
}

export interface EmailEsDocument {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  senderId: string;
  tenantId?: string;
  scheduledAt: Date | string;
  sentAt?: Date | string | null;
  createdAt?: Date | string;
}

export async function upsertEmailToElasticsearch(doc: EmailEsDocument): Promise<void> {
  try {
    await esClient.index({
      index: EMAILS_INDEX,
      id: doc.id,
      document: {
        id: doc.id,
        to: doc.to,
        subject: doc.subject,
        body: doc.body,
        status: doc.status,
        senderId: doc.senderId,
        tenantId: doc.tenantId || 'default_tenant',
        scheduledAt: doc.scheduledAt,
        sentAt: doc.sentAt || null,
        createdAt: doc.createdAt || new Date(),
      },
    });
  } catch (err: any) {
    console.error(`⚠️ Elasticsearch Upsert Warning (email ${doc.id}):`, err.message || err);
  }
}

export async function searchEmailsInElasticsearch(query: string) {
  try {
    if (!query || query.trim() === '') {
      const response = await esClient.search({
        index: EMAILS_INDEX,
        query: { match_all: {} },
        size: 50,
      });
      return response.hits.hits.map((hit) => hit._source);
    }

    const response = await esClient.search({
      index: EMAILS_INDEX,
      query: {
        multi_match: {
          query: query.trim(),
          fields: ['to^3', 'subject^2', 'body', 'status', 'id'],
          fuzziness: 'AUTO',
        },
      },
      size: 50,
    });

    return response.hits.hits.map((hit) => hit._source);
  } catch (err: any) {
    console.error('⚠️ Elasticsearch Search Error:', err.message || err);
    return [];
  }
}
