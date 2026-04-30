import { useState, useEffect } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { TextField, TextArea, Toggle, SelectField } from '../common/Fields'
import RichTextEditor from './RichTextEditor'
import { api } from '../../api'
import { Sparkles, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useT } from '../../i18n'

function Row({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function DescriptionEditor({ value, onChange, jd, language }) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [llmReady, setLlmReady] = useState(false)
  useEffect(() => { api.llmStatus().then((s) => setLlmReady(s.configured)).catch(() => {}) }, [])

  const improve = async () => {
    const plain = (value || '').replace(/<[^>]+>/g, '').trim()
    if (!plain) return
    setBusy(true)
    try {
      const { text } = await api.improve(plain, jd || '', language || 'en')
      onChange(`<p>${text}</p>`)
    } finally { setBusy(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="panel-title">{t('editor.description')}</div>
        {llmReady && (
          <button
            onClick={improve}
            disabled={busy}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            <Sparkles size={11}/> {busy ? t('editor.improving') : t('editor.ai_improve')}
          </button>
        )}
      </div>
      <RichTextEditor value={value} onChange={onChange}/>
    </div>
  )
}

// ---------- Per-type field sets ----------

function EducationFields({ entry, set, t }) {
  return (
    <div className="flex flex-col gap-3">
      <Row>
        <TextField label={t('editor.school')}   value={entry.school} onChange={(v) => set({ school: v })}/>
        <TextField label={t('editor.degree')}   value={entry.degree} onChange={(v) => set({ degree: v })}/>
      </Row>
      <Row>
        <TextField label={t('editor.field_of_study')} value={entry.field_of_study} onChange={(v) => set({ field_of_study: v })}/>
        <TextField label={t('editor.location')}       value={entry.location}       onChange={(v) => set({ location: v })}/>
      </Row>
      <Row>
        <TextField label={t('editor.start_date')} value={entry.start_date} onChange={(v) => set({ start_date: v })} placeholder="2021-09"/>
        <TextField label={t('editor.end_date')}   value={entry.end_date}   onChange={(v) => set({ end_date: v })}   placeholder="Present"/>
      </Row>
      <Row>
        <TextField label={t('editor.gpa')} value={entry.gpa} onChange={(v) => set({ gpa: v })}/>
        <div className="flex items-end pb-1">
          <Toggle label={t('editor.full_time')} value={entry.is_full_time} onChange={(v) => set({ is_full_time: v })}/>
        </div>
      </Row>
      <DescriptionEditor value={entry.description} onChange={(v) => set({ description: v })}/>
    </div>
  )
}

function ExperienceFields({ entry, set, t }) {
  return (
    <div className="flex flex-col gap-3">
      <Row>
        <TextField label={t('editor.position')} value={entry.position} onChange={(v) => set({ position: v })}/>
        <TextField label={t('editor.company')}  value={entry.company}  onChange={(v) => set({ company: v })}/>
      </Row>
      <Row>
        <TextField label={t('editor.location')} value={entry.location} onChange={(v) => set({ location: v })}/>
        <div className="flex items-end pb-1">
          <Toggle label={t('editor.currently_working')} value={entry.currently_working} onChange={(v) => set({ currently_working: v })}/>
        </div>
      </Row>
      <Row>
        <TextField label={t('editor.start_date')} value={entry.start_date} onChange={(v) => set({ start_date: v })}/>
        <TextField label={t('editor.end_date')}   value={entry.end_date}   onChange={(v) => set({ end_date: v })}/>
      </Row>
      <DescriptionEditor value={entry.description} onChange={(v) => set({ description: v })}/>
    </div>
  )
}

function ProjectFields({ entry, set, t }) {
  return (
    <div className="flex flex-col gap-3">
      <Row>
        <TextField label={t('editor.project_name')} value={entry.name} onChange={(v) => set({ name: v })}/>
        <TextField label={t('editor.role')}         value={entry.role} onChange={(v) => set({ role: v })}/>
      </Row>
      <Row>
        <TextField label={t('editor.start_date')} value={entry.start_date} onChange={(v) => set({ start_date: v })}/>
        <TextField label={t('editor.end_date')}   value={entry.end_date}   onChange={(v) => set({ end_date: v })}/>
      </Row>
      <TextField label={t('editor.link')} value={entry.link} onChange={(v) => set({ link: v })} placeholder="https://…"/>
      <DescriptionEditor value={entry.description} onChange={(v) => set({ description: v })}/>
    </div>
  )
}

function SkillFields({ entry, set, t }) {
  return (
    <div className="flex flex-col gap-3">
      <Row>
        <TextField label={t('editor.category')} value={entry.category} onChange={(v) => set({ category: v })}/>
        <SelectField label={t('editor.level')} value={entry.level || ''} onChange={(v) => set({ level: v })}
          options={[{value:'',label:'—'},
            {value:'Beginner',    label:t('editor.level_beginner')},
            {value:'Intermediate',label:t('editor.level_intermediate')},
            {value:'Advanced',    label:t('editor.level_advanced')},
            {value:'Expert',      label:t('editor.level_expert')},
          ]}/>
      </Row>
      <TextArea
        label={t('editor.items')}
        value={(entry.items || []).join(', ')}
        onChange={(v) => set({ items: v.split(',').map((x) => x.trim()).filter(Boolean) })}
        rows={2}/>
    </div>
  )
}

function AwardFields({ entry, set, t }) {
  return (
    <div className="flex flex-col gap-3">
      <Row>
        <TextField label={t('editor.title')}  value={entry.title}  onChange={(v) => set({ title: v })}/>
        <TextField label={t('editor.issuer')} value={entry.issuer} onChange={(v) => set({ issuer: v })}/>
      </Row>
      <TextField label={t('editor.date')} value={entry.date} onChange={(v) => set({ date: v })}/>
      <TextArea label={t('editor.description')} value={entry.description} onChange={(v) => set({ description: v })} rows={3}/>
    </div>
  )
}

function SummaryFields({ entry, set }) {
  return <DescriptionEditor value={entry.content} onChange={(v) => set({ content: v })}/>
}

function CustomFields({ entry, set, t }) {
  return (
    <div className="flex flex-col gap-3">
      <Row>
        <TextField label={t('editor.title')}    value={entry.title}    onChange={(v) => set({ title: v })}/>
        <TextField label={t('editor.subtitle')} value={entry.subtitle} onChange={(v) => set({ subtitle: v })}/>
      </Row>
      <TextField label={t('editor.date')} value={entry.date} onChange={(v) => set({ date: v })}/>
      <DescriptionEditor value={entry.description} onChange={(v) => set({ description: v })}/>
    </div>
  )
}

const FIELDS = {
  education: EducationFields,
  experience: ExperienceFields,
  projects: ProjectFields,
  skills: SkillFields,
  awards: AwardFields,
  summary: SummaryFields,
  custom: CustomFields,
}

/** Inline editor: expanded panel that drops down below a clicked entry row. */
export default function InlineEntryEditor({ moduleId, entryId, onClose, onDelete }) {
  const t = useT()
  const mod   = useResumeStore((s) => s.resume.modules.find((m) => m.id === moduleId))
  const entry = mod?.entries.find((e) => e.id === entryId)
  const updateEntry = useResumeStore((s) => s.updateEntry)

  if (!mod || !entry) return null
  const Fields = FIELDS[mod.type] || CustomFields
  const set = (patch) => updateEntry(moduleId, entryId, patch)

  return (
    <div className="bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-[15px] font-bold text-gray-900">{t('editor.edit_entry')}</span>
        <div className="flex items-center gap-1">
          <button
            className={'p-1.5 rounded-lg transition-colors ' +
              (entry.hidden ? 'text-gray-300 hover:text-gray-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}
            onClick={() => set({ hidden: !entry.hidden })}
            title={entry.hidden ? t('editor.show') : t('editor.hide')}
          >
            {entry.hidden ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
          {onDelete && (
            <button
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              onClick={onDelete}
              title={t('editor.delete')}
            >
              <Trash2 size={15}/>
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="p-5">
        <Fields entry={entry} set={set} t={t}/>

        {/* Done button */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-md active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {t('editor.done')}
        </button>
      </div>
    </div>
  )
}
