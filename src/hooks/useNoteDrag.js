import { useRef, useCallback, useEffect } from 'react'
import { useGesture } from 'react-use-gesture'
import { v4 as uuid } from 'uuid'
import { NOTE_HEIGHT, EIGHTH_WIDTH, MIN_MIDI_NOTE, MAX_MIDI_NOTE, RATE_MULTS } from '../globals'
import { constrain, snapPixels } from '../util'

const MIN_NOTE_WIDTH = 5

export default function useNoteDrag(
  lane,
  maxNote,
  minNote,
  snap,
  notes,
  setNotes,
  setSelectedNotes,
  setNoPointerEvents,
  setGrabbing,
  updateLaneState,
  selectedNotesRef,
  shiftPressed,
  altPressed,
  createdNote,
  dragChanged,
  noteDrag,
  startNoteDrag
) {
  const tempNote = useRef(null)

  // note creation

  const createNote = useGesture({
    onDragStart: ({ event, metaKey }) => {
      if (metaKey) {
        event.stopPropagation()
      }
      if (tempNote.current) {
        tempNote.current = null
      }
    },
    onDrag: ({ movement: [mx], initial: [ix], xy: [x], event, metaKey }) => {
      // create note
      const leftOffset = -lane.current?.getBoundingClientRect().left
      if (metaKey && !tempNote.current) {
        const laneNum = maxNote - minNote - +event.target?.getAttribute('lane-num')
        tempNote.current = uuid()
        const realX = ix + leftOffset
        setNotes((notes) => {
          const notesCopy = notes.slice()
          const { px, snapNumber } = snapPixels(realX, snap, -1)
          const newNote = {
            id: tempNote.current,
            midiNote: laneNum + minNote,
            velocity: 1,
            x: px,
            xSnap: snap,
            xSnapNumber: snapNumber,
            width: snap ? EIGHTH_WIDTH * RATE_MULTS[snap] : MIN_NOTE_WIDTH,
            widthSnap: snap,
            endSnap: snap,
          }
          notesCopy.push(newNote)
          // set as selected note
          setSelectedNotes([newNote.id])
          return notesCopy
        })
        setNoPointerEvents(true)
        createdNote.current = true
      } else if (tempNote.current) {
        event.stopPropagation()
        // update note
        setNotes((notes) => {
          const notesCopy = notes.slice()
          const note = notesCopy.find((note) => note.id === tempNote.current)
          const { px, snapNumber } = snapPixels(x + leftOffset, snap)
          note.width = snap ? Math.max(px - note.x, RATE_MULTS[snap] * EIGHTH_WIDTH) : Math.max(mx, MIN_NOTE_WIDTH)
          note.widthSnap = snap
          note.widthSnapNumber = snap && snapNumber - note.xSnapNumber
          note.endSnap = snap
          return notesCopy
        })
      }
    },
    onDragEnd: ({ event }) => {
      if (tempNote.current) {
        event.stopPropagation()
        setNoPointerEvents(false)
        updateLaneState()
      }
    },
  })

  // note dragging

  const addSelectedNotes = useCallback(
    (id) => {
      if (!selectedNotesRef.current.includes(id)) {
        if (shiftPressed.current) {
          selectedNotesRef.current.push(id)
        } else {
          selectedNotesRef.current = [id]
        }
      } else {
        selectedNotesRef.current.push(selectedNotesRef.current.splice(selectedNotesRef.current.indexOf(id), 1)[0])
      }
      setSelectedNotes(selectedNotesRef.current.slice())
    },
    [selectedNotesRef, setSelectedNotes, shiftPressed]
  )

  const onDragEnd = useCallback(
    (id, shiftKey) => {
      setNoPointerEvents(false)
      setGrabbing(false)
      if (!dragChanged.current && !shiftKey) {
        setSelectedNotes([id])
      } else if (dragChanged.current) {
        updateLaneState()
      }
      dragChanged.current = false
      dragDirection.current = 0
      overrideDefault.current = false
    },
    [dragChanged, setGrabbing, setNoPointerEvents, setSelectedNotes, updateLaneState]
  )

  const batchUpdateNotes = useCallback((notes, updateNotes) => {
    const notesCopy = []
    notes.forEach((note) => {
      notesCopy.push(updateNotes[note.id] ? updateNotes[note.id] : note)
    })
    // add new notes
    return notesCopy.concat(Object.values(updateNotes).filter((note) => !notesCopy.find((nc) => nc.id === note.id)))
  }, [])

  const notesRef = useRef(notes)
  useEffect(() => {
    notesRef.current = notes
  }, [notes])
  const snapRef = useRef(snap)
  useEffect(() => {
    snapRef.current = snap
  }, [snap])
  const updateLaneStateRef = useRef(updateLaneState)
  useEffect(() => {
    updateLaneStateRef.current = updateLaneState
  }, [updateLaneState])

  const dragStart = useRef()
  const noteStart = useRef()
  const dragDirection = useRef(0)
  const snapStart = useRef()
  const overrideDefault = useRef()
  const draggingNotes = useRef(false)
  const dragDuplicating = useRef(false)
  const newNotes = useRef(null)

  const currentDraggingNote = useRef()
  useEffect(() => {
    if (startNoteDrag) {
      // drag start
      currentDraggingNote.current = startNoteDrag
      if (altPressed.current) {
        // duplicating note(s) with alt key
        dragDuplicating.current = true
      } else {
        // normal note drag
        draggingNotes.current = true
        dragStart.current = selectedNotesRef.current.map((id) => notesRef.current.find((note) => note.id === id).x)
        noteStart.current = selectedNotesRef.current.map(
          (id) => notesRef.current.find((note) => note.id === id).midiNote
        )
        snapStart.current = selectedNotesRef.current.map((id) => notesRef.current.find((note) => note.id === id).xSnap)
      }
    } else {
      // drag end
      if (dragChanged.current) {
        updateLaneStateRef.current()
      } else if (draggingNotes.current && !shiftPressed.current) {
        setSelectedNotes(
          notesRef.current.find((note) => note.id === currentDraggingNote.current) ? [currentDraggingNote.current] : []
        )
      }
      draggingNotes.current = false
      dragDuplicating.current = false
      newNotes.current = null
      dragChanged.current = false
      dragDirection.current = 0
      overrideDefault.current = false
    }
  }, [altPressed, dragChanged, selectedNotesRef, setSelectedNotes, shiftPressed, startNoteDrag])

  // actual note dragging
  useEffect(() => {
    if (noteDrag && noteDrag.movement && noteDrag.direction) {
      const [mx, my] = noteDrag.movement
      const [dx] = noteDrag.direction
      dragChanged.current = mx || my
      const updateNotes = {}
      if (dragDuplicating.current && !newNotes.current) {
        // create new notes
        newNotes.current = selectedNotesRef.current.map((id) => {
          const note = Object.assign(
            {},
            notesRef.current.find((note) => note.id === id),
            { id: uuid() }
          )
          updateNotes[note.id] = note
          return note
        })
        dragStart.current = newNotes.current.map((d) => d.x)
        noteStart.current = newNotes.current.map((d) => d.midiNote)
        snapStart.current = newNotes.current.map((d) => d.xSnap)
        const ids = newNotes.current.map((n) => n.id)
        setSelectedNotes(ids)
        selectedNotesRef.current = ids
      }
      selectedNotesRef.current.forEach((id, i) => {
        const note = notesRef.current.find((n) => n.id === id)
        if (!note) return false
        let newX = dragStart.current[i]
        let newNote = noteStart.current[i]
        let xSnapNumber = note.xSnapNumber
        const shiftDirectionX = shiftPressed.current && Math.abs(mx) > Math.abs(my)
        // note position
        if (
          dragStart.current[i] !== undefined &&
          (Math.abs(mx) > 2 || overrideDefault.current) &&
          (!shiftPressed.current || shiftDirectionX)
        ) {
          if (dx) {
            dragDirection.current = dx
          }
          const lowerSnapBound = snapRef.current && snapPixels(dragStart.current[i], snapRef.current, -1).px
          const upperSnapBound = snapRef.current && lowerSnapBound + EIGHTH_WIDTH * RATE_MULTS[snapRef.current]
          const realX = dragStart.current[i] + mx
          if (snapRef.current && !snapStart.current[i] && (realX < lowerSnapBound || realX > upperSnapBound)) {
            snapStart.current[i] = snapRef.current
          }
          const direction = !snapStart.current[i] ? dragDirection.current : 0
          const { px, snapNumber } = snapPixels(realX, snapRef.current, direction)
          xSnapNumber = snapNumber
          newX = Math.max(px, 0)
          if (snapRef.current && newX !== dragStart.current[i]) {
            overrideDefault.current = true
          }
        }
        // midi note, y-axis
        if (noteStart.current[i] && (!shiftPressed.current || shiftDirectionX === false)) {
          newNote = constrain(noteStart.current[i] - Math.round(my / NOTE_HEIGHT), MIN_MIDI_NOTE, MAX_MIDI_NOTE)
        }
        updateNotes[id] = Object.assign({}, note, {
          x: newX,
          xSnap: snapRef.current,
          xSnapNumber,
          endSnap: snapRef.current && note.widthSnap === snapRef.current ? snapRef.current : null,
          midiNote: newNote,
        })
      })
      setNotes((notes) => batchUpdateNotes(notes, updateNotes))
    }
  }, [batchUpdateNotes, dragChanged, noteDrag, selectedNotesRef, setNotes, setSelectedNotes, shiftPressed])

  const widthStart = useRef()
  const dragNoteRight = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      addSelectedNotes(event.target?.parentElement?.id)
      widthStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).width)
      snapStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).endSnap)
    },
    onDrag: ({ movement: [mx], direction: [dx], event }) => {
      event.stopPropagation()
      dragChanged.current = mx
      const updateNotes = {}
      selectedNotesRef.current.forEach((id, i) => {
        const note = notes.find((note) => note.id === id)
        if (
          widthStart.current[i] &&
          (Math.abs(mx) > 2 || overrideDefault.current) &&
          (widthStart.current[i] + mx >= MIN_NOTE_WIDTH || note.width !== MIN_NOTE_WIDTH)
        ) {
          if (dx) {
            dragDirection.current = dx
          }
          const lowerSnapBound = snap && snapPixels(widthStart.current[i], snap, -1).px
          const upperSnapBound = snap && lowerSnapBound + EIGHTH_WIDTH * RATE_MULTS[snap]
          const width = widthStart.current[i] + mx
          if (snap && !snapStart.current[i] && (width < lowerSnapBound || width > upperSnapBound)) {
            snapStart.current[i] = snap
          }
          const direction = !snapStart.current[i] ? dragDirection.current : 0
          const { px, snapNumber } = snapPixels(width, snap, direction)
          const newWidth = Math.max(px, MIN_NOTE_WIDTH)
          if (!snap || newWidth !== widthStart.current[i]) {
            overrideDefault.current = true
          }
          updateNotes[id] = Object.assign({}, note, {
            width: newWidth,
            endSnap: snap,
            widthSnap: snap && snap === note.xSnap ? snap : null,
            widthSnapNumber: snapNumber,
          })
        }
      })
      setNotes((notes) => batchUpdateNotes(notes, updateNotes))
    },
    onDragEnd: ({ shiftKey, event }) => {
      event.stopPropagation()
      onDragEnd(event.target?.parentElement?.id, shiftKey)
    },
  })

  const dragNoteLeft = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      addSelectedNotes(event.target?.parentElement?.id)
      widthStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).width)
      dragStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).x)
      snapStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).xSnap)
    },
    onDrag: ({ movement: [mx], direction: [dx], event }) => {
      event.stopPropagation()
      dragChanged.current = mx
      const updateNotes = {}
      selectedNotesRef.current.forEach((id, i) => {
        const note = notes.find((note) => note.id === id)
        if (
          widthStart.current[i] &&
          (Math.abs(mx) > 2 || overrideDefault.current) &&
          (widthStart.current[i] - mx >= MIN_NOTE_WIDTH || note.width !== MIN_NOTE_WIDTH)
        ) {
          if (dx) {
            dragDirection.current = dx
          }
          const lowerSnapBound = snap && snapPixels(dragStart.current[i], snap, -1).px
          const upperSnapBound = snap && lowerSnapBound + EIGHTH_WIDTH * RATE_MULTS[snap]
          const realX = dragStart.current[i] + mx
          if (snap && !snapStart.current[i] && (realX < lowerSnapBound || realX > upperSnapBound)) {
            snapStart.current[i] = snap
          }
          const direction = !snapStart.current[i] ? dragDirection.current : 0
          const { px, snapNumber } = snapPixels(realX, snap, direction)
          const newX = Math.max(px, 0)
          if (!snap || newX !== dragStart.current[i]) {
            overrideDefault.current = true
          }
          const newWidth = dragStart.current[i] + widthStart.current[i] - newX
          const widthSnapping = snap && snap === note.widthSnap
          updateNotes[id] = Object.assign({}, note, {
            x: newX,
            width: newWidth,
            xSnap: snap,
            xSnapNumber: snapNumber,
            widthSnap: widthSnapping ? snap : null,
            widthSnapNumber: widthSnapping ? Math.floor(newWidth / (EIGHTH_WIDTH * RATE_MULTS[snap])) : null,
          })
        }
      })
      setNotes((notes) => batchUpdateNotes(notes, updateNotes))
    },
    onDragEnd: ({ shiftKey, event }) => {
      event.stopPropagation()
      onDragEnd(event.target?.parentElement?.id, shiftKey)
    },
  })

  return { createNote, dragNoteLeft, dragNoteRight }
}
