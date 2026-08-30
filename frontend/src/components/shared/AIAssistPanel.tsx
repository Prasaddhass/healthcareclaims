import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Collapse, Divider, Drawer, Input, List, Select, Space, Tabs, Typography, message } from 'antd';
import type { CodeSuggestion, ErrorExplanation, ValidationErrorInput, ChatMessage, ChatSource } from '@/api/aiApi';
import { aiApi } from '@/api/aiApi';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

interface PanelMessage extends ChatMessage {
  sources?: ChatSource[];
}

interface AIAssistPanelProps {
  open: boolean;
  onClose: () => void;
  claimId?: string;
  validationErrors?: ValidationErrorInput[];
}

const AIAssistPanel: React.FC<AIAssistPanelProps> = ({ open, onClose, claimId, validationErrors = [] }) => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const [suggestDescription, setSuggestDescription] = useState('');
  const [suggestType, setSuggestType] = useState<'ICD' | 'CPT'>('ICD');
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [explanations, setExplanations] = useState<ErrorExplanation[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const explainableErrors = useMemo(() => validationErrors, [validationErrors]);

  const handleChatSubmit = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const nextMessages: PanelMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setChatInput('');
    try {
      const response = await aiApi.chat(trimmed, claimId, nextMessages.map(({ role, content }) => ({ role, content })));
      setMessages((current) => [...current, { role: 'assistant', content: response.response, sources: response.sources }]);
    } catch {
      void message.error('AI chat request failed.');
    }
  };

  const handleSuggestCodes = async () => {
    if (!suggestDescription.trim()) return;
    try {
      const response = await aiApi.suggestCodes(suggestDescription, suggestType);
      setSuggestions(response.suggestions);
    } catch {
      void message.error('Unable to get code suggestions.');
    }
  };

  const handleExplainErrors = async () => {
    try {
      const response = await aiApi.explainErrors(explainableErrors);
      setExplanations(response.explanations);
    } catch {
      void message.error('Unable to explain validation errors.');
    }
  };

  return (
    <Drawer open={open} onClose={onClose} placement="right" width={420} title="AI Assist" destroyOnHidden>
      <Tabs
        items={[
          {
            key: 'chat',
            label: 'Chat',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {messages.map((item, index) => (
                    <div key={`${item.role}-${index}`} style={{ marginBottom: 12 }}>
                      <Paragraph strong={item.role === 'assistant'}>{item.content}</Paragraph>
                      {item.sources?.length ? (
                        <Collapse
                          items={[
                            {
                              key: `${index}`,
                              label: 'Sources',
                              children: item.sources.map((source) => (
                                <Paragraph key={`${source.document}-${source.excerpt}`}>
                                  <Text strong>{source.document}</Text>: {source.excerpt}
                                </Paragraph>
                              )),
                            },
                          ]}
                        />
                      ) : null}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <TextArea
                  aria-label="AI chat input"
                  placeholder="Ask a billing or claim question"
                  rows={4}
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onPressEnter={(event) => {
                    if (!event.shiftKey) {
                      event.preventDefault();
                      void handleChatSubmit();
                    }
                  }}
                />
                <Button type="primary" onClick={() => void handleChatSubmit()}>
                  Send
                </Button>
              </Space>
            ),
          },
          {
            key: 'suggest',
            label: 'Suggest Codes',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select value={suggestType} onChange={(value) => setSuggestType(value)} options={[{ value: 'ICD', label: 'ICD' }, { value: 'CPT', label: 'CPT' }]} />
                <TextArea
                  rows={4}
                  value={suggestDescription}
                  onChange={(event) => setSuggestDescription(event.target.value)}
                  placeholder="Describe the visit or procedure"
                />
                <Button onClick={() => void handleSuggestCodes()}>Suggest Codes</Button>
                <List
                  dataSource={suggestions}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta title={`${item.code} ? ${item.description}`} description={`${Math.round(item.confidence * 100)}% confidence`} />
                    </List.Item>
                  )}
                />
              </Space>
            ),
          },
          {
            key: 'errors',
            label: 'Explain Errors',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button onClick={() => void handleExplainErrors()} disabled={explainableErrors.length === 0}>
                  Explain Current Errors
                </Button>
                <Divider style={{ margin: '8px 0' }} />
                <List
                  dataSource={explanations}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta title={item.field} description={`${item.plain_english} ${item.suggested_fix}`} />
                    </List.Item>
                  )}
                />
              </Space>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default AIAssistPanel;
