import { useState, useRef } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { useT } from '../../i18n'
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Check, Lock, GripVertical, EyeOff,
  LayoutTemplate, Rows3, Type, User, GraduationCap, Briefcase,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Constants ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'flowcv-style', name: 'Studio',  desc: 'Two-column · icon headings' },
  { id: 'classic',      name: 'Classic', desc: 'Single column · traditional' },
  { id: 'minimal',      name: 'Minimal', desc: 'Clean · no color · compact'  },
]

const FONT_SIZES   = [9, 9.5, 10, 10.5, 11, 11.5, 12]
const LINE_HEIGHTS = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8]

const LR_MARGINS = [
  { id: 24, label: 'Narrow' },
  { id: 40, label: 'Normal' },
  { id: 56, label: 'Wide'   },
  { id: 72, label: 'Extra'  },
]
const TB_MARGINS = [
  { id: 12, label: 'Tight'    },
  { id: 24, label: 'Normal'   },
  { id: 36, label: 'Relaxed'  },
  { id: 48, label: 'Spacious' },
]
const ENTRY_SPACINGS = [4, 6, 8, 10, 12, 16]

const ENTRY_LAYOUTS = [
  { id: 'inline',    label: 'Inline'    },
  { id: 'left-col',  label: 'Left col'  },
  { id: 'right-col', label: 'Right col' },
]

const TITLE_SIZES    = [10, 11, 12, 13, 14]
const SUBTITLE_SIZES = [9, 10, 11, 12, 13]

const SUBTITLE_STYLES = [
  { id: 'underline',   label: 'Underline' },
  { id: 'double-line', label: 'Double'    },
  { id: 'box',         label: 'Box'       },
  { id: 'pill',        label: 'Pill'      },
  { id: 'left-bar',    label: 'Left bar'  },
  { id: 'plain',       label: 'Plain'     },
]

const PHOTO_SIZES = [
  { id: 55, label: 'XS' },
  { id: 70, label: 'S'  },
  { id: 90, label: 'M'  },
  { id: 110, label: 'L' },
  { id: 130, label: 'XL'},
]

const PHOTO_SHAPES = ['circle', 'square', 'rounded-sm', 'rounded-md', 'rounded']

const CONTACT_SEPS_INLINE = [
  { id: 'icon',   label: '☺ Icon'   },
  { id: 'bullet', label: '• Bullet' },
  { id: 'bar',    label: '| Bar'    },
]
const CONTACT_SEPS_BLOCK = [
  { id: 'icon', label: '☺ Icon' },
  { id: 'none', label: '✕ None' },
]

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Outfit', 'Lato', 'Poppins',
  'Open Sans', 'Montserrat', 'Merriweather', 'Playfair Display',
  'Source Sans Pro', 'Noto Sans SC', 'LXGW WenKai',
]

// ─── Visual SVGs ─────────────────────────────────────────────────────────────

function PhotoPositionSVG({ pos, active }) {
  const c = active ? '#6366f1' : '#d1d5db'
  if (pos === 'left') return (
    <svg viewBox="0 0 58 40" width="58" height="40">
      <circle cx="13" cy="20" r="9" fill={c}/>
      <rect x="27" y="13" width="25" height="3.5" rx="1.75" fill={c}/>
      <rect x="27" y="19" width="19" height="3.5" rx="1.75" fill={c}/>
      <rect x="27" y="25" width="22" height="3.5" rx="1.75" fill={c}/>
    </svg>
  )
  if (pos === 'top') return (
    <svg viewBox="0 0 58 40" width="58" height="40">
      <circle cx="29" cy="11" r="9" fill={c}/>
      <rect x="8"  y="24" width="42" height="3.5" rx="1.75" fill={c}/>
      <rect x="14" y="30" width="30" height="3.5" rx="1.75" fill={c}/>
    </svg>
  )
  return (
    <svg viewBox="0 0 58 40" width="58" height="40">
      <rect x="6"  y="13" width="25" height="3.5" rx="1.75" fill={c}/>
      <rect x="6"  y="19" width="19" height="3.5" rx="1.75" fill={c}/>
      <rect x="6"  y="25" width="22" height="3.5" rx="1.75" fill={c}/>
      <circle cx="45" cy="20" r="9" fill={c}/>
    </svg>
  )
}

function PhotoShapeSVG({ shape, active }) {
  const stroke = active ? '#6366f1' : '#d1d5db'
  const fill   = active ? 'rgba(99,102,241,0.15)' : 'none'
  const sw = 2.5
  if (shape === 'circle') return (
    <svg viewBox="0 0 40 40" width="32" height="32">
      <circle cx="20" cy="20" r="14" fill={fill} stroke={stroke} strokeWidth={sw}/>
    </svg>
  )
  const rx = { square: 0, 'rounded-sm': 4, 'rounded-md': 9, rounded: 15 }[shape] ?? 0
  return (
    <svg viewBox="0 0 40 40" width="32" height="32">
      <rect x="4" y="4" width="32" height="32" rx={rx} fill={fill} stroke={stroke} strokeWidth={sw}/>
    </svg>
  )
}

function AlignmentSVG({ align, active }) {
  const c = active ? '#6366f1' : '#d1d5db'
  if (align === 'left') return (
    <svg viewBox="0 0 62 38" width="62" height="38">
      <rect x="10" y="11" width="32" height="4.5" rx="2.25" fill={c}/>
      <rect x="10" y="19" width="24" height="4.5" rx="2.25" fill={c}/>
    </svg>
  )
  return (
    <svg viewBox="0 0 62 38" width="62" height="38">
      <rect x="15" y="11" width="32" height="4.5" rx="2.25" fill={c}/>
      <rect x="19" y="19" width="24" height="4.5" rx="2.25" fill={c}/>
    </svg>
  )
}

function ArrangementSVG({ type, active }) {
  const c = active ? '#6366f1' : '#d1d5db'
  if (type === 'single') return (
    <svg viewBox="0 0 62 40" width="62" height="40">
      <rect x="8"  y="9"  width="46" height="3.5" rx="1.75" fill={c}/>
      <rect x="8"  y="16" width="38" height="3.5" rx="1.75" fill={c}/>
      <rect x="8"  y="23" width="42" height="3.5" rx="1.75" fill={c}/>
    </svg>
  )
  if (type === 'inline') return (
    <svg viewBox="0 0 62 40" width="62" height="40">
      <rect x="4"  y="16" width="13" height="3.5" rx="1.75" fill={c}/>
      <circle cx="21" cy="17.75" r="2" fill={c}/>
      <rect x="25" y="16" width="13" height="3.5" rx="1.75" fill={c}/>
      <circle cx="42" cy="17.75" r="2" fill={c}/>
      <rect x="46" y="16" width="12" height="3.5" rx="1.75" fill={c}/>
    </svg>
  )
  return (
    <svg viewBox="0 0 62 40" width="62" height="40">
      <rect x="4"  y="9"  width="24" height="3.5" rx="1.75" fill={c}/>
      <rect x="34" y="9"  width="24" height="3.5" rx="1.75" fill={c}/>
      <rect x="4"  y="16" width="20" height="3.5" rx="1.75" fill={c}/>
      <rect x="34" y="16" width="24" height="3.5" rx="1.75" fill={c}/>
      <rect x="4"  y="23" width="22" height="3.5" rx="1.75" fill={c}/>
      <rect x="34" y="23" width="18" height="3.5" rx="1.75" fill={c}/>
    </svg>
  )
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function CkBox({ label, value, onChange }) {
  return (
    <button className="flex items-center gap-2.5 group" onClick={() => onChange(!value)}>
      <div className={[
        'w-5 h-5 rounded border-2 flex items-center justify-center flex-none transition-colors',
        value
          ? 'bg-indigo-600 border-indigo-600'
          : 'border-gray-300 bg-white group-hover:border-indigo-400',
      ].join(' ')}>
        {value && <Check size={10} className="text-white" strokeWidth={3}/>}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  )
}

function VisualCard({ active, onClick, disabled, label, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all w-full',
        active
          ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
          : disabled
          ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
          : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer',
      ].join(' ')}
    >
      {children}
      {label !== undefined && (
        <span className={`text-[11px] leading-none ${active ? 'text-indigo-700 font-semibold' : 'text-gray-500'}`}>
          {label}
        </span>
      )}
    </button>
  )
}

function ColLabel({ label }) {
  return <div className="text-xs font-semibold text-gray-700">{label}</div>
}

// ─── Photo module ─────────────────────────────────────────────────────────────

function PhotoSection({ c, update }) {
  const [open, setOpen] = useState(true)
  const t = useT()
  const centerLocked = c.personal_alignment === 'center'
  const closestSize = PHOTO_SIZES.reduce((a, b) =>
    Math.abs(b.id - c.photo_size) < Math.abs(a.id - c.photo_size) ? b : a
  ).id

  return (
    <div className="card">
      <button
        className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{t('cust.photo')}</span>
        {open
          ? <ChevronUp size={14} className="text-gray-400"/>
          : <ChevronDown size={14} className="text-gray-400"/>}
      </button>
      {open && <div className="p-4 flex flex-col gap-4">
        {/* Show */}
        <div className="flex flex-col gap-2.5">
          <CkBox label={t('cust.show_photo')} value={c.show_photo ?? true} onChange={(v) => update({ show_photo: v })}/>
        </div>

        {/* Photo position */}
        <div className="flex flex-col gap-1.5">
          <ColLabel label={t('cust.photo_position')}/>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'left',  label: t('cust.pos_left')  },
              { id: 'top',   label: t('cust.pos_top')   },
              { id: 'right', label: t('cust.pos_right') },
            ].map(({ id, label }) => {
              const isDisabled = (centerLocked && id !== 'top') || (c.personal_alignment === 'left' && id === 'top')
              return (
              <VisualCard
                key={id}
                active={c.photo_position === id}
                disabled={isDisabled}
                onClick={() => update({ photo_position: id })}
                label={label}
              >
                <PhotoPositionSVG pos={id} active={c.photo_position === id}/>
              </VisualCard>
            )})}
          </div>
          {centerLocked && (
            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-1">
              <Lock size={9}/> {t('cust.photo_lock_center')}
            </div>
          )}
          {c.personal_alignment === 'left' && (
            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-1">
              <Lock size={9}/> {t('cust.photo_lock_left')}
            </div>
          )}
        </div>

        {/* Size */}
        <div className="flex flex-col gap-1.5">
          <ColLabel label={t('cust.photo_size')}/>
          <div className="flex gap-1.5">
            {PHOTO_SIZES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => update({ photo_size: id })}
                className={'chip flex-1 justify-center ' + (closestSize === id ? 'chip-active' : '')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Shape */}
        <div className="flex flex-col gap-1.5">
          <ColLabel label={t('cust.photo_shape')}/>
          <div className="grid grid-cols-5 gap-2">
            {PHOTO_SHAPES.map((shape) => (
              <VisualCard
                key={shape}
                active={c.photo_shape === shape}
                onClick={() => update({ photo_shape: shape })}
              >
                <PhotoShapeSVG shape={shape} active={c.photo_shape === shape}/>
              </VisualCard>
            ))}
          </div>
        </div>
      </div>}
    </div>
  )
}

// ─── Personal details / Header layout module ──────────────────────────────────

function HeaderLayoutSection({ c, update }) {
  const [open, setOpen] = useState(true)
  const t = useT()

  const setAlignment = (v) => {
    if (v === 'center') {
      update({ personal_alignment: 'center', photo_position: 'top' })
    } else if (v === 'left') {
      if (c.photo_position === 'top') {
        update({ personal_alignment: 'left', photo_position: 'right' })
      } else {
        update({ personal_alignment: 'left' })
      }
    } else {
      update({ personal_alignment: v })
    }
  }

  return (
    <div className="card">
      <button
        className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{t('cust.personal_details')}</span>
        {open
          ? <ChevronUp size={14} className="text-gray-400"/>
          : <ChevronDown size={14} className="text-gray-400"/>}
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-4">
          {/* Header layout label */}
          <div className="text-xs font-bold text-gray-800 uppercase tracking-[0.12em]">{t('cust.header_layout')}</div>

          {/* Text alignment */}
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.text_align')}/>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'left',   label: t('cust.align_left')   },
                { id: 'center', label: t('cust.align_center') },
              ].map(({ id, label }) => (
                <VisualCard
                  key={id}
                  active={c.personal_alignment === id}
                  onClick={() => setAlignment(id)}
                  label={label}
                >
                  <AlignmentSVG align={id} active={c.personal_alignment === id}/>
                </VisualCard>
              ))}
            </div>
          </div>

          {/* Details arrangement */}
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.arrangement')}/>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'single', label: t('cust.arr_single') },
                { id: 'inline', label: t('cust.arr_inline') },
                { id: 'double', label: t('cust.arr_double') },
              ].map(({ id, label }) => (
                <VisualCard
                  key={id}
                  active={c.contacts_columns === id}
                  onClick={() => {
                    const patch = { contacts_columns: id }
                    // Reset separator to 'icon' when leaving inline with bullet/bar selected
                    if (id !== 'inline' && ['bullet', 'bar'].includes(c.contact_separator)) {
                      patch.contact_separator = 'icon'
                    }
                    update(patch)
                  }}
                  label={label}
                >
                  <ArrangementSVG type={id} active={c.contacts_columns === id}/>
                </VisualCard>
              ))}
            </div>
          </div>

          {/* Contact separator */}
          {(() => {
            const isInline = c.contacts_columns === 'inline'
            const seps = isInline ? CONTACT_SEPS_INLINE : CONTACT_SEPS_BLOCK
            return (
              <div className="flex flex-col gap-1.5">
                <ColLabel label={t('cust.contact_sep')}/>
                <div className={`grid gap-1.5 ${isInline ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {seps.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => update({ contact_separator: id })}
                      className={'chip justify-center ' + (c.contact_separator === id ? 'chip-active' : '')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ─── Name & Role Title ────────────────────────────────────────────────────────

function SkillsColumnSVG({ cols, active }) {
  const c = active ? '#6366f1' : '#d1d5db'
  const gap = 3
  const totalW = 54
  const colW = (totalW - gap * (cols - 1)) / cols
  return (
    <svg viewBox="0 0 58 28" width="58" height="28">
      {Array.from({ length: cols }).map((_, i) => (
        <rect
          key={i}
          x={4 + i * (colW + gap)}
          y="6"
          width={colW}
          height="16"
          rx="2"
          fill={c}
        />
      ))}
    </svg>
  )
}

function NameTitleSection({ c, update }) {
  const [open, setOpen] = useState(true)
  const t = useT()
  return (
    <div className="card">
      <button
        className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{t('cust.name_title')}</span>
        {open
          ? <ChevronUp size={14} className="text-gray-400"/>
          : <ChevronDown size={14} className="text-gray-400"/>}
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-4">
          {/* Position */}
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.name_pos')}/>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'same-line', label: t('cust.name_pos_same') },
                { id: 'below',     label: t('cust.name_pos_below') },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => update({ name_title_position: id })}
                  className={'chip justify-center ' + ((c.name_title_position ?? 'below') === id ? 'chip-active' : '')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Name size */}
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.name_size')}/>
            <div className="flex gap-1.5">
              {['S', 'M', 'L'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => update({ name_size: sz })}
                  className={'chip flex-1 justify-center ' + ((c.name_size ?? 'L') === sz ? 'chip-active' : '')}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Name font */}
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.name_font')}/>
            <select
              value={c.name_font ?? 'Inter'}
              onChange={(e) => update({ name_font: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:border-indigo-400 focus:outline-none"
            >
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <CkBox label={t('cust.name_bold')} value={c.name_bold ?? true} onChange={(v) => update({ name_bold: v })}/>

          {/* Title font */}
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.title_font')}/>
            <select
              value={c.title_font ?? 'Inter'}
              onChange={(e) => update({ title_font: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:border-indigo-400 focus:outline-none"
            >
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <CkBox label={t('cust.title_bold')} value={c.title_bold ?? false} onChange={(v) => update({ title_bold: v })}/>
        </div>
      )}
    </div>
  )
}

// ─── Skills Section ──────────────────────────────────────────────────────────

function SkillsSection({ c, update }) {
  const [open, setOpen] = useState(true)
  const t = useT()
  return (
    <div className="card">
      <button
        className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{t('cust.skills_sec')}</span>
        {open
          ? <ChevronUp size={14} className="text-gray-400"/>
          : <ChevronDown size={14} className="text-gray-400"/>}
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.display_style')}/>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'grid',   label: t('cust.skills_grid')   },
                { id: 'bubble', label: t('cust.skills_bubble') },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => update({ skills_style: id })}
                  className={'chip justify-center ' + ((c.skills_style ?? 'grid') === id ? 'chip-active' : '')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {(c.skills_style ?? 'grid') === 'grid' && (
            <div className="flex flex-col gap-1.5">
              <ColLabel label={t('cust.skills_cols')}/>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <VisualCard
                    key={n}
                    active={(c.skills_columns ?? 1) === n}
                    onClick={() => update({ skills_columns: n })}
                  >
                    <SkillsColumnSVG cols={n} active={(c.skills_columns ?? 1) === n}/>
                  </VisualCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Education Section ───────────────────────────────────────────────────────

function EducationSection({ c, update }) {
  const [open, setOpen] = useState(true)
  const t = useT()
  return (
    <div className="card">
      <button
        className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{t('cust.education_sec')}</span>
        {open
          ? <ChevronUp size={14} className="text-gray-400"/>
          : <ChevronDown size={14} className="text-gray-400"/>}
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.edu_order')}/>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'degree-school', label: t('cust.edu_degree_school') },
                { id: 'school-degree', label: t('cust.edu_school_degree') },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => update({ education_title_order: id })}
                  className={'chip justify-center ' + ((c.education_title_order ?? 'school-degree') === id ? 'chip-active' : '')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Experience Section ──────────────────────────────────────────────────────

function ExperienceSection({ c, update }) {
  const [open, setOpen] = useState(true)
  const t = useT()
  return (
    <div className="card">
      <button
        className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{t('cust.experience_sec')}</span>
        {open
          ? <ChevronUp size={14} className="text-gray-400"/>
          : <ChevronDown size={14} className="text-gray-400"/>}
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <ColLabel label={t('cust.exp_order')}/>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'position-company', label: t('cust.exp_pos_co') },
                { id: 'company-position', label: t('cust.exp_co_pos') },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => update({ experience_title_order: id })}
                  className={'chip justify-center ' + ((c.experience_title_order ?? 'company-position') === id ? 'chip-active' : '')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function ModuleSection({ icon: Icon, label, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card">
      <button
        className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {open
          ? <ChevronUp size={14} className="text-gray-400"/>
          : <ChevronDown size={14} className="text-gray-400"/>}
      </button>
      {open && <div className="p-4 flex flex-col gap-5">{children}</div>}
    </div>
  )
}

function SubSection({ label, children }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 font-semibold">
          {label}
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      {children}
    </div>
  )
}

function ChoiceRow({ label, value, options, onChange, columns }) {
  return (
    <div>
      {label && <div className="panel-title mb-1.5">{label}</div>}
      <div
        className={columns ? 'grid gap-1' : 'flex flex-wrap gap-1'}
        style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      >
        {options.map((o) => {
          const v = typeof o === 'number' ? o : typeof o === 'string' ? o : (o.id ?? o.value)
          const l = typeof o === 'number' ? String(o) : typeof o === 'string' ? o : o.label
          const active = value === v
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={'chip ' + (active ? 'chip-active' : '')}
            >
              {l}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── DiscreteSlider ──────────────────────────────────────────────────────────

const THUMB_W = 44

function DiscreteSlider({ label, value, options, onChange, unit = '' }) {
  const vals       = options.map((o) => (typeof o === 'object' ? o.id : o))
  const dispLabels = options.map((o) =>
    typeof o === 'object' ? (o.label ?? String(o.id)) : String(o)
  )
  const N   = options.length
  const idx = Math.max(0, vals.indexOf(value))
  const select = (i) => onChange(vals[Math.max(0, Math.min(N - 1, i))])

  const handleTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (N - 1))
    select(i)
  }

  const thumbLeft = N > 1
    ? `clamp(0px, calc(${(idx / (N - 1)) * 100}% - ${THUMB_W / 2}px), calc(100% - ${THUMB_W}px))`
    : `calc(50% - ${THUMB_W / 2}px)`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="panel-title">{label}</span>
        <span className="text-xs text-gray-400 font-mono tabular-nums">
          {dispLabels[idx]}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="relative flex-1 h-10 bg-gray-100 rounded-xl cursor-pointer select-none overflow-hidden"
          onClick={handleTrackClick}
        >
          <div
            className="absolute top-0 h-full bg-indigo-600 rounded-xl pointer-events-none"
            style={{ width: THUMB_W, left: thumbLeft }}
          />
          {Array.from({ length: N }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-px bg-gray-300 pointer-events-none"
              style={{ height: '40%', left: N > 1 ? `${(i / (N - 1)) * 100}%` : '50%' }}
            />
          ))}
        </div>
        <button
          onClick={() => select(idx - 1)}
          disabled={idx === 0}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 text-lg font-light hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
        >−</button>
        <button
          onClick={() => select(idx + 1)}
          disabled={idx === N - 1}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 text-lg font-light hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
        >+</button>
      </div>
    </div>
  )
}

// ─── EntryLayoutPicker ───────────────────────────────────────────────────────

// Colors used in all layout SVGs
const C = {
  title:    '#1e293b',
  subtitle: '#94a3b8',
  body:     '#e2e8f0',
  date:     '#6366f1',   // always indigo — highlights WHERE the date goes
  dateFade: '#c7d2fe',
  colBg:    '#f1f5f9',
  divider:  '#e2e8f0',
}

function InlineLayoutSVG() {
  return (
    <svg viewBox="0 0 88 64" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ height: 64 }}>
      {/* Title + date on same row */}
      <rect x="6"  y="10" width="38" height="5"   rx="1.5" fill={C.title}/>
      <rect x="62" y="10" width="20" height="5"   rx="2"   fill={C.date} opacity="0.85"/>
      {/* Subtitle */}
      <rect x="6"  y="19" width="28" height="3.5" rx="1"   fill={C.subtitle}/>
      {/* Body lines */}
      <rect x="6"  y="28" width="76" height="3"   rx="1"   fill={C.body}/>
      <rect x="6"  y="34" width="60" height="3"   rx="1"   fill={C.body}/>
      <rect x="6"  y="40" width="68" height="3"   rx="1"   fill={C.body}/>
    </svg>
  )
}

function LeftColLayoutSVG() {
  return (
    <svg viewBox="0 0 88 64" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ height: 64 }}>
      {/* Left column background */}
      <rect x="4" y="6" width="22" height="52" rx="3" fill={C.colBg}/>
      {/* Date in left col */}
      <rect x="7"  y="11" width="16" height="3.5" rx="1" fill={C.date} opacity="0.9"/>
      <rect x="7"  y="17" width="13" height="3"   rx="1" fill={C.dateFade}/>
      <rect x="7"  y="23" width="15" height="2.5" rx="1" fill={C.dateFade} opacity="0.7"/>
      {/* Divider */}
      <line x1="30" y1="8" x2="30" y2="56" stroke={C.divider} strokeWidth="1"/>
      {/* Title */}
      <rect x="34" y="10" width="44" height="5"   rx="1.5" fill={C.title}/>
      {/* Subtitle */}
      <rect x="34" y="19" width="30" height="3.5" rx="1"   fill={C.subtitle}/>
      {/* Body lines */}
      <rect x="34" y="28" width="48" height="3"   rx="1"   fill={C.body}/>
      <rect x="34" y="34" width="40" height="3"   rx="1"   fill={C.body}/>
      <rect x="34" y="40" width="44" height="3"   rx="1"   fill={C.body}/>
    </svg>
  )
}

function RightColLayoutSVG() {
  return (
    <svg viewBox="0 0 88 64" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ height: 64 }}>
      {/* Title */}
      <rect x="6"  y="10" width="44" height="5"   rx="1.5" fill={C.title}/>
      {/* Subtitle */}
      <rect x="6"  y="19" width="30" height="3.5" rx="1"   fill={C.subtitle}/>
      {/* Body lines */}
      <rect x="6"  y="28" width="48" height="3"   rx="1"   fill={C.body}/>
      <rect x="6"  y="34" width="40" height="3"   rx="1"   fill={C.body}/>
      <rect x="6"  y="40" width="44" height="3"   rx="1"   fill={C.body}/>
      {/* Divider */}
      <line x1="58" y1="8" x2="58" y2="56" stroke={C.divider} strokeWidth="1"/>
      {/* Right column background */}
      <rect x="62" y="6" width="22" height="52" rx="3" fill={C.colBg}/>
      {/* Date in right col */}
      <rect x="65" y="11" width="16" height="3.5" rx="1" fill={C.date} opacity="0.9"/>
      <rect x="65" y="17" width="13" height="3"   rx="1" fill={C.dateFade}/>
      <rect x="65" y="23" width="15" height="2.5" rx="1" fill={C.dateFade} opacity="0.7"/>
    </svg>
  )
}

function EntryLayoutPicker({ value, onChange }) {
  const t = useT()
  const LAYOUT_CARDS = [
    { id: 'inline',    label: t('cust.layout_inline'),    SVG: InlineLayoutSVG   },
    { id: 'left-col',  label: t('cust.layout_left_col'),  SVG: LeftColLayoutSVG  },
    { id: 'right-col', label: t('cust.layout_right_col'), SVG: RightColLayoutSVG },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {LAYOUT_CARDS.map(({ id, label, SVG }) => {
        const active = value === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={
              'relative flex flex-col items-stretch rounded-xl border p-2 pb-2.5 transition-all ' +
              (active
                ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
                : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-white')
            }
          >
            {active && (
              <div className="absolute top-1.5 right-1.5 w-[14px] h-[14px] rounded-full bg-indigo-600 flex items-center justify-center">
                <svg width="7" height="6" viewBox="0 0 8 7" fill="none">
                  <polyline points="1 3.5 3.2 5.8 7 1" stroke="white" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div className={'rounded-lg overflow-hidden ' + (active ? 'bg-white' : 'bg-white/70')}>
              <SVG />
            </div>
            <div className={'mt-2 text-center text-[11px] font-semibold tracking-wide ' +
              (active ? 'text-indigo-700' : 'text-gray-500')}>
              {label}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Template thumbnails ─────────────────────────────────────────────────────

function FlowCVThumb() {
  return (
    <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="130" fill="white" />
      {/* Header */}
      <rect x="7"  y="8"  width="58" height="5"   rx="1"   fill="#1e293b" />
      <rect x="7"  y="15" width="40" height="2.5" rx="0.5" fill="#94a3b8" />
      {/* Column divider */}
      <line x1="38" y1="24" x2="38" y2="122" stroke="#e5e7eb" strokeWidth="0.7" />
      {/* Left sidebar headings */}
      <rect x="7" y="24" width="24" height="2.5" rx="0.5" fill="#2563eb" opacity="0.7" />
      <circle cx="10" cy="32" r="1.8" fill="#2563eb" opacity="0.5" />
      <rect x="14" y="30.5" width="17" height="2"   rx="0.5" fill="#334155" />
      <rect x="14" y="34.5" width="14" height="1.5" rx="0.5" fill="#94a3b8" />
      <circle cx="10" cy="42" r="1.8" fill="#2563eb" opacity="0.5" />
      <rect x="14" y="40.5" width="19" height="2"   rx="0.5" fill="#334155" />
      <rect x="14" y="44.5" width="15" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="7"  y="52" width="24" height="2.5" rx="0.5" fill="#2563eb" opacity="0.7" />
      <rect x="7"  y="57" width="28" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="7"  y="61" width="25" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="7"  y="65" width="27" height="1.5" rx="0.5" fill="#94a3b8" />
      {/* Right content */}
      <rect x="42" y="24" width="24" height="2.5" rx="0.5" fill="#2563eb" opacity="0.7" />
      <rect x="42" y="29" width="50" height="2"   rx="0.5" fill="#334155" />
      <rect x="42" y="33" width="48" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="42" y="37" width="45" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="42" y="42" width="50" height="2"   rx="0.5" fill="#334155" />
      <rect x="42" y="46" width="48" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="42" y="50" width="44" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="42" y="56" width="24" height="2.5" rx="0.5" fill="#2563eb" opacity="0.7" />
      <rect x="42" y="61" width="50" height="2"   rx="0.5" fill="#334155" />
      <rect x="42" y="65" width="45" height="1.5" rx="0.5" fill="#94a3b8" />
    </svg>
  )
}

function ClassicThumb() {
  return (
    <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="130" fill="white" />
      {/* Centered name */}
      <rect x="20" y="8"  width="60" height="5"   rx="1"   fill="#1e293b" />
      <rect x="30" y="15" width="40" height="2.5" rx="0.5" fill="#94a3b8" />
      {/* Section 1 */}
      <rect x="7" y="25" width="28" height="3" rx="0.5" fill="#1e293b" />
      <line x1="7" y1="29.5" x2="93" y2="29.5" stroke="#1e293b" strokeWidth="0.8" />
      <rect x="7" y="33" width="86" height="2"   rx="0.5" fill="#334155" />
      <rect x="7" y="37" width="82" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="7" y="41" width="78" height="1.5" rx="0.5" fill="#94a3b8" />
      {/* Section 2 */}
      <rect x="7" y="49" width="32" height="3" rx="0.5" fill="#1e293b" />
      <line x1="7" y1="53.5" x2="93" y2="53.5" stroke="#1e293b" strokeWidth="0.8" />
      <rect x="7" y="57" width="86" height="2"   rx="0.5" fill="#334155" />
      <rect x="7" y="61" width="78" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="7" y="65" width="82" height="1.5" rx="0.5" fill="#94a3b8" />
      <rect x="7" y="70" width="86" height="2"   rx="0.5" fill="#334155" />
      <rect x="7" y="74" width="74" height="1.5" rx="0.5" fill="#94a3b8" />
      {/* Section 3 */}
      <rect x="7" y="82" width="22" height="3" rx="0.5" fill="#1e293b" />
      <line x1="7" y1="86.5" x2="93" y2="86.5" stroke="#1e293b" strokeWidth="0.8" />
      <rect x="7" y="90" width="86" height="2"   rx="0.5" fill="#334155" />
      <rect x="7" y="94" width="80" height="1.5" rx="0.5" fill="#94a3b8" />
    </svg>
  )
}

function MinimalThumb() {
  return (
    <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="130" fill="white" />
      {/* Centered name block */}
      <rect x="18" y="8"  width="64" height="6"   rx="1"   fill="#111827" />
      <rect x="28" y="17" width="44" height="2.5" rx="0.5" fill="#6b7280" />
      <rect x="10" y="22" width="80" height="0.5" rx="0.25" fill="#d1d5db" />
      {/* Section 1 — thin rule, small heading */}
      <rect x="10" y="28" width="20" height="2" rx="0.5" fill="#374151" />
      <rect x="10" y="31" width="80" height="0.4" fill="#e5e7eb" />
      <rect x="10" y="35" width="80" height="1.8" rx="0.5" fill="#374151" />
      <rect x="10" y="39" width="70" height="1.4" rx="0.5" fill="#9ca3af" />
      <rect x="10" y="43" width="74" height="1.4" rx="0.5" fill="#9ca3af" />
      {/* Section 2 */}
      <rect x="10" y="51" width="28" height="2" rx="0.5" fill="#374151" />
      <rect x="10" y="54" width="80" height="0.4" fill="#e5e7eb" />
      <rect x="10" y="58" width="80" height="1.8" rx="0.5" fill="#374151" />
      <rect x="10" y="62" width="68" height="1.4" rx="0.5" fill="#9ca3af" />
      <rect x="10" y="66" width="72" height="1.4" rx="0.5" fill="#9ca3af" />
      <rect x="10" y="72" width="80" height="1.8" rx="0.5" fill="#374151" />
      <rect x="10" y="76" width="62" height="1.4" rx="0.5" fill="#9ca3af" />
      {/* Section 3 */}
      <rect x="10" y="84" width="18" height="2" rx="0.5" fill="#374151" />
      <rect x="10" y="87" width="80" height="0.4" fill="#e5e7eb" />
      <rect x="10" y="91" width="80" height="1.8" rx="0.5" fill="#374151" />
      <rect x="10" y="95" width="74" height="1.4" rx="0.5" fill="#9ca3af" />
    </svg>
  )
}

function TemplateThumbnail({ id }) {
  if (id === 'classic') return <ClassicThumb />
  if (id === 'minimal') return <MinimalThumb />
  return <FlowCVThumb />
}

// ─── Template Carousel ───────────────────────────────────────────────────────

function TemplateCarousel({ current, onApply }) {
  const t = useT()
  const [pending, setPending] = useState(current)
  const scrollRef = useRef(null)

  const TEMPLATES = [
    { id: 'flowcv-style', name: t('cust.tpl_studio'),  desc: t('cust.tpl_studio_desc')  },
    { id: 'classic',      name: t('cust.tpl_classic'), desc: t('cust.tpl_classic_desc') },
    { id: 'minimal',      name: t('cust.tpl_minimal'), desc: t('cust.tpl_minimal_desc') },
  ]

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 152, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          className="flex-none w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto flex-1 scroll-smooth no-scrollbar"
        >
          {TEMPLATES.map((tpl) => {
            const isApplied = current === tpl.id
            const isSel     = pending === tpl.id
            return (
              <div
                key={tpl.id}
                onClick={() => setPending(tpl.id)}
                className={[
                  'flex-none w-[130px] cursor-pointer rounded-lg border overflow-hidden transition-all',
                  isSel
                    ? 'border-indigo-400 shadow-[0_0_14px_-4px_rgba(99,102,241,0.3)]'
                    : 'border-gray-200 hover:border-gray-300',
                ].join(' ')}
              >
                <div className="aspect-[5/6.5] bg-white overflow-hidden">
                  <TemplateThumbnail id={tpl.id} />
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-gray-100">
                  <div>
                    <div className="text-[11px] text-gray-900 font-medium leading-tight">{tpl.name}</div>
                    <div className="text-[9px] text-gray-400 leading-tight mt-0.5">{tpl.desc}</div>
                  </div>
                  {isApplied && (
                    <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-none ml-1">
                      <Check size={9} className="text-indigo-600" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          className="flex-none w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Apply */}
      <button
        onClick={() => onApply(pending)}
        disabled={pending === current}
        className={[
          'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
          pending !== current
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed',
        ].join(' ')}
      >
        <Check size={12} />
        {pending === current ? t('cust.applied') : t('cust.apply_tpl')}
      </button>
    </div>
  )
}

// ─── Section Reorder ─────────────────────────────────────────────────────────

function SortableSection({ mod }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mod.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors',
        mod.hidden
          ? 'border-gray-100 bg-white opacity-50'
          : 'border-gray-200 bg-white hover:border-gray-300',
      ].join(' ')}
    >
      <button
        className="text-gray-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing flex-none"
        {...attributes} {...listeners}
      >
        <GripVertical size={13} />
      </button>
      <span className="flex-1 text-xs text-gray-800 truncate">{mod.name}</span>
      {mod.hidden && <EyeOff size={11} className="text-zinc-600 flex-none" />}
    </div>
  )
}

function SectionReorder() {
  const t       = useT()
  const modules = useResumeStore((s) => s.resume.modules)
  const reorder = useResumeStore((s) => s.reorderModules)

  const personalMod = modules.find((m) => m.type === 'personal_details')
  const otherMods   = modules.filter((m) => m.type !== 'personal_details')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids  = otherMods.map((m) => m.id)
    const next = arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id))
    reorder([...(personalMod ? [personalMod.id] : []), ...next])
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Personal Details — pinned */}
      {personalMod && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded border border-cyan-400/25 bg-cyan-400/5">
          <Lock size={11} className="text-cyan-400 flex-none" />
          <span className="flex-1 text-xs text-gray-800 truncate">{personalMod.name}</span>
          <span className="text-[9px] text-cyan-400/50 uppercase tracking-widest flex-none">
            {t('cust.pinned')}
          </span>
        </div>
      )}

      {/* Other sections — draggable */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={otherMods.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {otherMods.map((m) => <SortableSection key={m.id} mod={m} />)}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CustomizePanel() {
  const t      = useT()
  const c      = useResumeStore((s) => s.resume.customize)
  const update = useResumeStore((s) => s.updateCustomize)

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4 app-scrollbar">

      {/* ── Personal detail ── */}
      <HeaderLayoutSection c={c} update={update}/>

      {/* ── Photo ── */}
      <PhotoSection c={c} update={update}/>

      {/* ── Template ── */}
      <ModuleSection icon={LayoutTemplate} label={t('cust.template')}>
        <TemplateCarousel
          current={c.template}
          onApply={(v) => update({ template: v })}
        />
      </ModuleSection>

      {/* ── Layout & Spacing ── */}
      <ModuleSection icon={Rows3} label={t('cust.layout_spacing')}>

        {/* 1 · Columns */}
        <SubSection label={t('cust.columns')}>
          <ChoiceRow
            value={c.columns}
            onChange={(v) => update({ columns: v })}
            options={[
              { id: 'single', label: t('cust.col_single') },
              { id: 'two',    label: t('cust.col_double') },
            ]}
            columns={2}
          />
        </SubSection>

        {/* 2 · Section Order */}
        <SubSection label={t('cust.section_order')}>
          <SectionReorder />
        </SubSection>

        {/* 3 · Spacing */}
        <SubSection label={t('cust.spacing')}>
          <DiscreteSlider
            label={t('cust.font_size')}
            value={c.font_size}
            onChange={(v) => update({ font_size: v })}
            options={FONT_SIZES.map((n) => ({ id: n, label: String(n) }))}
            unit="pt"
          />
          <DiscreteSlider
            label={t('cust.line_height')}
            value={c.line_height}
            onChange={(v) => update({ line_height: v })}
            options={LINE_HEIGHTS.map((n) => ({ id: n, label: String(n) }))}
          />
          <DiscreteSlider
            label={t('cust.lr_margin')}
            value={c.page_margin}
            onChange={(v) => update({ page_margin: v })}
            options={LR_MARGINS}
          />
          <DiscreteSlider
            label={t('cust.tb_margin')}
            value={c.vertical_margin ?? 24}
            onChange={(v) => update({ vertical_margin: v })}
            options={TB_MARGINS}
          />
          <DiscreteSlider
            label={t('cust.entry_spacing')}
            value={c.entry_spacing}
            onChange={(v) => update({ entry_spacing: v })}
            options={ENTRY_SPACINGS.map((n) => ({ id: n, label: String(n) }))}
            unit="px"
          />
        </SubSection>

        {/* 4 · Entry Layout */}
        <SubSection label={t('cust.entry_layout_section')}>
          <EntryLayoutPicker
            value={c.entry_layout ?? 'inline'}
            onChange={(v) => update({ entry_layout: v })}
          />
          <DiscreteSlider
            label={t('cust.entry_title_size')}
            value={c.entry_title_size ?? 11}
            onChange={(v) => update({ entry_title_size: v })}
            options={TITLE_SIZES.map((n) => ({ id: n, label: String(n) }))}
            unit="pt"
          />
          <DiscreteSlider
            label={t('cust.section_heading_size')}
            value={c.subtitle_size ?? 11}
            onChange={(v) => update({ subtitle_size: v })}
            options={SUBTITLE_SIZES.map((n) => ({ id: n, label: String(n) }))}
            unit="pt"
          />
          <ChoiceRow
            label={t('cust.section_heading_style')}
            value={c.subtitle_style ?? 'underline'}
            onChange={(v) => update({ subtitle_style: v })}
            options={[
              { id: 'underline',   label: t('cust.style_underline') },
              { id: 'double-line', label: t('cust.style_double')    },
              { id: 'box',         label: t('cust.style_box')       },
              { id: 'pill',        label: t('cust.style_pill')      },
              { id: 'left-bar',    label: t('cust.style_left_bar')  },
              { id: 'plain',       label: t('cust.style_plain')     },
            ]}
            columns={3}
          />
        </SubSection>

      </ModuleSection>

      {/* ── Name & Role Title ── */}
      <NameTitleSection c={c} update={update}/>

      {/* ── Education ── */}
      <EducationSection c={c} update={update}/>

      {/* ── Work Experience ── */}
      <ExperienceSection c={c} update={update}/>

      {/* ── Skills ── */}
      <SkillsSection c={c} update={update}/>

    </div>
  )
}
