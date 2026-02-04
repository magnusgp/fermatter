"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronDown, FileText, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
interface FeedbackNote {
  id: string;
  paragraphId: string;
  anchorText: string;
  title: string;
  question: string;
  note: string;
  type: "clarity" | "structure" | "tone" | "grammar";
  severity: "low" | "medium" | "high";
  position: number;
}

interface Paragraph {
  id: string;
  content: string;
}

type WritingMode = "scientific" | "journalist" | "email";

// Sample data
const sampleParagraphs: Paragraph[] = [
  {
    id: "p1",
    content: "The quantum entanglement phenomenon represents a fundamental aspect of quantum mechanics. This non-local correlation between particles has been experimentally verified numerous times.",
  },
  {
    id: "p2",
    content: "Recent studies have shown that entangled particles maintain their correlation regardless of the distance separating them. This challenges our classical understanding of locality.",
  },
  {
    id: "p3",
    content: "The implications for quantum computing are profound. Researchers believe this could revolutionize information processing in ways we're only beginning to understand.",
  },
];

const sampleFeedback: FeedbackNote[] = [
  {
    id: "f1",
    paragraphId: "p1",
    anchorText: "fundamental aspect",
    title: "Vague terminology",
    question: "Can you be more specific about what makes this fundamental?",
    note: "Consider explaining which specific properties or principles make entanglement fundamental to quantum mechanics. This will help readers understand its significance.",
    type: "clarity",
    severity: "medium",
    position: 0,
  },
  {
    id: "f2",
    paragraphId: "p2",
    anchorText: "challenges our classical understanding",
    title: "Unclear connection",
    question: "How exactly does this challenge classical physics?",
    note: "Elaborate on the specific aspects of classical physics that are contradicted. Mention Einstein's 'spooky action at a distance' concern for context.",
    type: "structure",
    severity: "high",
    position: 1,
  },
  {
    id: "f3",
    paragraphId: "p3",
    anchorText: "profound",
    title: "Subjective language",
    question: "Is this the right tone for scientific writing?",
    note: "In scientific writing, consider replacing subjective terms with specific, measurable impacts. What makes these implications 'profound' in concrete terms?",
    type: "tone",
    severity: "low",
    position: 2,
  },
];

// Utility to find text position in paragraph
function findTextPosition(paragraphContent: string, anchorText: string): { start: number; end: number } | null {
  const index = paragraphContent.toLowerCase().indexOf(anchorText.toLowerCase());
  if (index === -1) return null;
  return { start: index, end: index + anchorText.length };
}

// FeedbackNote Component
interface FeedbackNoteProps {
  note: FeedbackNote;
  isExpanded: boolean;
  isHovered: boolean;
  onToggle: () => void;
  onHover: (hover: boolean) => void;
  onClick: () => void;
}

const FeedbackNoteComponent: React.FC<FeedbackNoteProps> = ({
  note,
  isExpanded,
  isHovered,
  onToggle,
  onHover,
  onClick,
}) => {
  const typeColors = {
    clarity: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    structure: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    tone: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    grammar: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  };

  const severityColors = {
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    medium: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    high: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
  };

  const icons = {
    clarity: Info,
    structure: FileText,
    tone: AlertCircle,
    grammar: AlertTriangle,
  };

  const Icon = icons[note.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mb-3 rounded-lg border bg-background p-3 shadow-sm transition-all cursor-pointer",
        isHovered && "shadow-md ring-2 ring-blue-400/50"
      )}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground mb-1">{note.title}</h4>
            <p className="text-xs text-muted-foreground">{note.question}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground mb-1">Anchor quote:</p>
                <p className="text-xs font-medium text-foreground">"{note.anchorText}"</p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{note.note}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs", typeColors[note.type])}>
                  {note.type}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", severityColors[note.severity])}>
                  {note.severity}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Component
export function FermatterMarginFeedback() {
  const [mode, setMode] = useState<WritingMode>("scientific");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const marginRef = useRef<HTMLDivElement>(null);

  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNoteClick = (note: FeedbackNote) => {
    setActiveNote(note.id);
    const paragraphEl = document.getElementById(note.paragraphId);
    if (paragraphEl) {
      paragraphEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const getHighlightedNote = () => {
    return hoveredNote || activeNote;
  };

  const renderParagraphWithHighlight = (paragraph: Paragraph) => {
    const relevantNotes = sampleFeedback.filter((n) => n.paragraphId === paragraph.id);
    const highlightedNoteId = getHighlightedNote();
    const highlightedNote = relevantNotes.find((n) => n.id === highlightedNoteId);

    if (!highlightedNote) {
      return <p className="text-foreground leading-relaxed">{paragraph.content}</p>;
    }

    const position = findTextPosition(paragraph.content, highlightedNote.anchorText);
    if (!position) {
      return <p className="text-foreground leading-relaxed">{paragraph.content}</p>;
    }

    const before = paragraph.content.slice(0, position.start);
    const highlighted = paragraph.content.slice(position.start, position.end);
    const after = paragraph.content.slice(position.end);

    return (
      <p className="text-foreground leading-relaxed">
        {before}
        <span className="bg-blue-200 dark:bg-blue-800 px-1 rounded transition-colors">
          {highlighted}
        </span>
        {after}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Fermatter</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Mode Selector */}
              <div className="flex flex-col gap-1">
                <div className="flex rounded-lg bg-muted p-1">
                  {(["scientific", "journalist", "email"] as WritingMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "relative px-4 py-2 text-sm font-medium rounded-md transition-all capitalize",
                        mode === m
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode === m && (
                        <motion.div
                          layoutId="mode-bg"
                          className="absolute inset-0 bg-background rounded-md shadow-sm"
                          transition={{ type: "spring", duration: 0.4 }}
                        />
                      )}
                      <span className="relative z-10">{m}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Mode changes critique style only — no rewriting.
                </p>
              </div>

              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Editor */}
          <div
            ref={editorRef}
            className="bg-card rounded-lg border p-8 shadow-sm min-h-[600px]"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-6 text-foreground">
                Quantum Entanglement: A Brief Overview
              </h2>
              <div className="space-y-4">
                {sampleParagraphs.map((para) => (
                  <div
                    key={para.id}
                    id={para.id}
                    className={cn(
                      "p-3 rounded-lg transition-all",
                      sampleFeedback.some(
                        (n) => n.paragraphId === para.id && n.id === getHighlightedNote()
                      ) && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    {renderParagraphWithHighlight(para)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Margin */}
          <div ref={marginRef} className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Feedback Notes
              </h3>
              <div className="space-y-2">
                {sampleFeedback.map((note) => (
                  <FeedbackNoteComponent
                    key={note.id}
                    note={note}
                    isExpanded={expandedNotes.has(note.id)}
                    isHovered={hoveredNote === note.id}
                    onToggle={() => toggleNote(note.id)}
                    onHover={(hover) => setHoveredNote(hover ? note.id : null)}
                    onClick={() => handleNoteClick(note)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FermatterDemo() {
  return <FermatterMarginFeedback />;
}
