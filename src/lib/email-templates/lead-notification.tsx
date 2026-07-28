import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface TranscriptLine {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  name?: string | null
  contact?: string | null
  city?: string | null
  hasGeyser?: boolean | null
  hasWifi?: boolean | null
  isRenter?: boolean | null
  transcript?: TranscriptLine[]
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#111' }
const container = { padding: '24px', maxWidth: '580px' }
const label = { color: '#666', fontSize: '13px', margin: '0 0 4px' }
const value = { fontSize: '15px', margin: '0 0 12px', color: '#111' }
const bubble = (isUser: boolean) => ({
  padding: '10px 12px',
  borderRadius: '10px',
  margin: '6px 0',
  background: isUser ? '#f4f4f5' : '#111',
  color: isUser ? '#111' : '#fff',
  fontSize: '14px',
  lineHeight: '1.45',
})

const yesno = (v: boolean | null | undefined) =>
  v === true ? 'Yes' : v === false ? 'No' : '—'

const Email = ({
  name,
  contact,
  city,
  hasGeyser,
  hasWifi,
  isRenter,
  transcript = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New GeyserBrain lead: {name ?? 'unnamed'} ({city ?? 'unknown'})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={{ margin: '0 0 20px', fontSize: '22px' }}>
          New qualified lead
        </Heading>

        <Section>
          <Text style={label}>Name</Text>
          <Text style={value}>{name ?? '(not given)'}</Text>

          <Text style={label}>Contact</Text>
          <Text style={value}>{contact ?? '(not given)'}</Text>

          <Text style={label}>City</Text>
          <Text style={value}>{city ?? '(unknown)'}</Text>

          <Text style={label}>Geyser · Wi-Fi · Renter</Text>
          <Text style={value}>
            {yesno(hasGeyser)} · {yesno(hasWifi)} · {yesno(isRenter)}
          </Text>
        </Section>

        <Hr style={{ margin: '20px 0', borderColor: '#eee' }} />

        <Heading as="h2" style={{ fontSize: '16px', margin: '0 0 12px' }}>
          Transcript
        </Heading>
        {transcript.length === 0 ? (
          <Text style={{ color: '#666' }}>No transcript captured.</Text>
        ) : (
          transcript.map((m, i) => (
            <div key={i} style={bubble(m.role === 'user')}>
              <strong style={{ display: 'block', fontSize: '11px', opacity: 0.7, marginBottom: '2px' }}>
                {m.role === 'user' ? 'Visitor' : 'Bot'}
              </strong>
              {m.content}
            </div>
          ))
        )}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `New GeyserBrain lead: ${data.name ?? 'unnamed'} (${data.city ?? 'unknown'})`,
  displayName: 'Lead notification',
  to: 'timothy.s@bookestyle.com',
  previewData: {
    name: 'Jane Doe',
    contact: '+27 82 123 4567',
    city: 'pretoria',
    hasGeyser: true,
    hasWifi: true,
    isRenter: false,
    transcript: [
      { role: 'assistant', content: "Hey, I'm here to check if we can help — what's going on with your place?" },
      { role: 'user', content: "My geyser is old and eats power. I'm in Pretoria, wifi works." },
      { role: 'assistant', content: "You're a great fit. What's your name so I can pass it on?" },
      { role: 'user', content: 'Jane Doe, +27 82 123 4567.' },
    ],
  },
} satisfies TemplateEntry
