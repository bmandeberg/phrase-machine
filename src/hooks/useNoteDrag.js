import { useRef, useCallback, useEffect } from 'react'
import { useGesture } from 'react-use-gesture'
import { v4 as uuid } from 'uuid'
import { NOTE_HEIGHT, EIGHTH_WIDTH, MIN_MIDI_NOTE, MAX_MIDI_NOTE, RATE_MULTS } from '../globals'
import { constrain, snapPixels } from '../util'

const MIN_NOTE_WIDTH = 5

export default function useNoteDrag(
  id,
  lane,
  maxNote,
  minNote,
  snap,
  notes,
  setNotes,
  setSelectedNotes,
  setNoPointerEvents,
  updateLaneState,
  selectedNotesRef,
  shiftPressed,
  altPressed,
  createdNote,
  dragChanged,
  noteDrag,
  startNoteDrag,
  setSelectNotes,
  playNote
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
          widthSnapNumber: snap ? 1 : null,
          widthSnap: snap,
          endSnap: snap,
        }
        playNote(newNote)
        notesCopy.push(newNote)
        // set as selected note
        setTimeout(() => {
          setSelectNotes({ [id]: [newNote.id] })
        })
        setNotes(notesCopy)
        setNoPointerEvents(true)
        createdNote.current = true
      } else if (tempNote.current) {
        event.stopPropagation()
        // update note
        const notesCopy = notes.slice()
        const note = notesCopy.find((note) => note.id === tempNote.current)
        const { px, snapNumber } = snapPixels(x + leftOffset, snap)
        note.width = snap ? Math.max(px - note.x, RATE_MULTS[snap] * EIGHTH_WIDTH) : Math.max(mx, MIN_NOTE_WIDTH)
        note.widthSnap = snap
        note.widthSnapNumber = snap && Math.max(snapNumber - note.xSnapNumber, 1)
        note.endSnap = snap
        setNotes(notesCopy)
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

  const batchUpdateNotes = useCallback((notes, updateNotes) => {
    const notesCopy = []
    for (const note of notes) {
      notesCopy.push(updateNotes[note.id] ? updateNotes[note.id] : note)
    }
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
  const dragEnd = useRef()
  const noteStart = useRef()
  const currentNote = useRef()
  const dragDirection = useRef(0)
  const snapStart = useRef()
  const widthStart = useRef()
  const overrideDefault = useRef()
  const draggingNotes = useRef(false)
  const draggingRight = useRef(false)
  const draggingLeft = useRef(false)
  const dragDuplicating = useRef(false)
  const newNotes = useRef(null)

  const currentDraggingNote = useRef()
  const draggingThisLane = useRef(false)
  const noteShiftSelected = useRef(false)
  useEffect(() => {
    if (startNoteDrag && startNoteDrag.note) {
      // drag start
      currentDraggingNote.current = startNoteDrag.note
      draggingThisLane.current = !!notesRef.current.find((note) => note.id === currentDraggingNote.current)
      if (altPressed.current) {
        // duplicating note(s) with alt key
        dragDuplicating.current = true
        // handle note selection
        if (!startNoteDrag.preselected) {
          const newSelectedNotes = draggingThisLane.current ? [currentDraggingNote.current] : []
          selectedNotesRef.current = newSelectedNotes
          setSelectedNotes(newSelectedNotes)
        }
      } else {
        // handle note selection
        if (draggingThisLane.current) {
          if (!startNoteDrag.preselected) {
            noteShiftSelected.current = shiftPressed.current
            const newSelectedNotes = shiftPressed.current
              ? selectedNotesRef.current.concat([currentDraggingNote.current])
              : [currentDraggingNote.current]
            selectedNotesRef.current = newSelectedNotes
            setSelectedNotes(newSelectedNotes)
          }
        } else if (!shiftPressed.current && !startNoteDrag.preselected) {
          selectedNotesRef.current = []
          setSelectedNotes([])
        }
        dragStart.current = selectedNotesRef.current.map((id) => notesRef.current.find((note) => note.id === id).x)
        if (['drag', 'drag-left'].includes(startNoteDrag.type)) {
          snapStart.current = selectedNotesRef.current.map(
            (id) => notesRef.current.find((note) => note.id === id).xSnap
          )
        }
        if (['drag-right', 'drag-left'].includes(startNoteDrag.type)) {
          widthStart.current = selectedNotesRef.current.map(
            (id) => notesRef.current.find((note) => note.id === id).width
          )
        }
        if (startNoteDrag.type === 'drag') {
          // normal note drag
          draggingNotes.current = true
          noteStart.current = selectedNotesRef.current.map(
            (id) => notesRef.current.find((note) => note.id === id).midiNote
          )
          currentNote.current = selectedNotesRef.current.map(
            (id) => notesRef.current.find((note) => note.id === id).midiNote
          )
        } else if (startNoteDrag.type === 'drag-right') {
          // drag-right
          draggingRight.current = true
          dragEnd.current = selectedNotesRef.current.map((id) => {
            const note = notesRef.current.find((note) => note.id === id)
            return note.x + note.width
          })
          snapStart.current = selectedNotesRef.current.map(
            (id) => notesRef.current.find((note) => note.id === id).endSnap
          )
        } else if (startNoteDrag.type === 'drag-left') {
          // drag-left
          draggingLeft.current = true
        }
      }
      // play selected notes
      for (const selectedNote of selectedNotesRef.current) {
        const noteData = notesRef.current.find((note) => note.id === selectedNote)
        if (noteData) {
          playNote(noteData)
        }
      }
    } else {
      // drag end
      if (dragChanged.current) {
        updateLaneStateRef.current()
      } else {
        // update note selection
        if (!shiftPressed.current) {
          setSelectedNotes(draggingThisLane.current ? [currentDraggingNote.current] : [])
        } else if (draggingThisLane.current) {
          if (selectedNotesRef.current.includes(currentDraggingNote.current)) {
            if (!noteShiftSelected.current) {
              setSelectedNotes((selectedNotes) => selectedNotes.filter((id) => id !== currentDraggingNote.current))
            }
          } else {
            setSelectedNotes((selectedNotes) => selectedNotes.concat([currentDraggingNote.current]))
          }
        }
      }
      draggingNotes.current = false
      draggingRight.current = false
      draggingLeft.current = false
      dragDuplicating.current = false
      newNotes.current = null
      dragChanged.current = false
      dragDirection.current = 0
      overrideDefault.current = false
      noteShiftSelected.current = false
    }
  }, [altPressed, dragChanged, playNote, selectedNotesRef, setSelectedNotes, shiftPressed, startNoteDrag])

  // actual note dragging
  useEffect(() => {
    if (noteDrag && noteDrag.movement && noteDrag.direction) {
      const [mx, my] = noteDrag.movement
      const [dx] = noteDrag.direction
      dragChanged.current = draggingNotes.current ? mx || my : mx
      const updateNotes = {}
      // create new notes if duplicating
      if (dragDuplicating.current && !newNotes.current) {
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
        if (draggingNotes.current || dragDuplicating.current) {
          /*
            dragging notes
          */
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
            // play notes when dragging to a new note lane
            if (newNote !== currentNote.current[i]) {
              playNote({ ...note, midiNote: newNote })
              currentNote.current[i] = newNote
            }
          }
          updateNotes[id] = Object.assign({}, note, {
            x: newX,
            xSnap: snapRef.current,
            xSnapNumber,
            endSnap: snapRef.current && note.widthSnap === snapRef.current ? snapRef.current : null,
            midiNote: newNote,
          })
        } else if (draggingRight.current) {
          /*
            drag-right
          */
          if (
            dragEnd.current[i] !== undefined &&
            widthStart.current[i] !== undefined &&
            (Math.abs(mx) > 2 || overrideDefault.current) &&
            (widthStart.current[i] + mx >= MIN_NOTE_WIDTH || note.width !== MIN_NOTE_WIDTH)
          ) {
            if (dx) {
              dragDirection.current = dx
            }
            const lowerSnapBound = snapRef.current && snapPixels(dragEnd.current[i], snapRef.current, -1).px
            const upperSnapBound = snapRef.current && lowerSnapBound + EIGHTH_WIDTH * RATE_MULTS[snapRef.current]
            const realX = dragEnd.current[i] + mx
            if (snapRef.current && !snapStart.current[i] && (realX < lowerSnapBound || realX > upperSnapBound)) {
              snapStart.current[i] = snapRef.current
            }
            const direction = !snapStart.current[i] ? dragDirection.current : 0
            const { px, snapNumber } = snapPixels(realX, snapRef.current, direction)
            const newX = Math.max(px, MIN_NOTE_WIDTH)
            if (!snapRef.current || newX !== dragEnd.current[i]) {
              overrideDefault.current = true
            }
            updateNotes[id] = Object.assign({}, note, {
              width: newX - dragStart.current[i],
              endSnap: snapRef.current,
              widthSnap: snapRef.current && snapRef.current === note.xSnap ? snapRef.current : null,
              widthSnapNumber: snapNumber,
            })
          }
        } else if (draggingLeft.current) {
          /*
            drag-left
          */
          if (
            widthStart.current[i] &&
            (Math.abs(mx) > 2 || overrideDefault.current) &&
            (widthStart.current[i] - mx >= MIN_NOTE_WIDTH || note.width !== MIN_NOTE_WIDTH)
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
            const newX = Math.max(px, 0)
            if (!snapRef.current || newX !== dragStart.current[i]) {
              overrideDefault.current = true
            }
            const newWidth = dragStart.current[i] + widthStart.current[i] - newX
            const widthSnapping = snapRef.current && snapRef.current === note.widthSnap
            updateNotes[id] = Object.assign({}, note, {
              x: newX,
              width: newWidth,
              xSnap: snapRef.current,
              xSnapNumber: snapNumber,
              widthSnap: widthSnapping ? snapRef.current : null,
              widthSnapNumber: widthSnapping
                ? Math.floor(newWidth / (EIGHTH_WIDTH * RATE_MULTS[snapRef.current]))
                : null,
            })
          }
        }
      })
      setNotes((notes) => batchUpdateNotes(notes, updateNotes))
    }
  }, [batchUpdateNotes, dragChanged, noteDrag, playNote, selectedNotesRef, setNotes, setSelectedNotes, shiftPressed])

  return { createNote }
}
