import { useRef } from 'react'
import * as Tone from 'tone'
import { useGesture } from 'react-use-gesture'
import { NOTE_HEIGHT, EIGHTH_WIDTH, RATE_MULTS, MIN_DELIMITER_WIDTH, KEYS_WIDTH } from '../globals'
import { boxesIntersect, timeToPixels, pixelsToTime, positionToPixels, snapPixels, constrain } from '../util'

export default function useGlobalDrag(
  delimiters,
  setNoPointerEvents,
  setGrabbing,
  setEwResizing,
  setStartNoteDrag,
  selectedNotes,
  setSelectNotes,
  setDraggingDelimiter,
  wasDraggingDelimiter,
  setNsResizing,
  setChangingProbability,
  snap,
  setSelectingDimensions,
  mainContainerRef,
  setNoteDrag,
  draggingDelimiter,
  windowLaneLength,
  setDelimiters,
  changingProbability,
  uiState,
  setPlayheadPosition,
  selectingDimensions,
  delimiterDragHover,
  setUIState,
  updateChosenLane,
  cancelClick,
  setEndPosition,
  targetNoteStart,
  anyLaneSoloed
) {
  const dragSelecting = useRef(false)
  const draggingNote = useRef(false)
  const dragStart = useRef()
  const snapStart = useRef()
  const dragChanged = useRef()
  const dragDirection = useRef()
  const overrideDefault = useRef()
  const delimiterIndex = useRef()
  const delimitersRef = useRef(delimiters)
  const laneID = useRef()
  const fullHeight = useRef()
  const percentage = useRef()
  const draggingPlayhead = useRef(false)
  const draggingEnd = useRef(false)

  const globalDrag = useGesture({
    onDragStart: ({ initial: [x, y], metaKey, event }) => {
      if (!metaKey && event.button === 0 && !event.target.closest('.knob')) {
        if (
          event.target.classList.contains('note') ||
          event.target.classList.contains('note-drag-right') ||
          event.target.classList.contains('note-drag-left')
        ) {
          //
          // dragging notes
          //
          draggingNote.current = true
          setNoPointerEvents(true)
          let noteID, type
          if (event.target.classList.contains('note')) {
            noteID = event.target.id
            type = 'drag'
            setGrabbing(true)
          } else {
            noteID = event.target.parentElement.id
            setEwResizing(true)
            type = event.target.classList.contains('note-drag-right') ? 'drag-right' : 'drag-left'
          }
          // attach initial note data
          let noteData
          for (const lane of uiState.lanes) {
            for (const note of lane.notes) {
              if (note.id === noteID) {
                noteData = note
                break
              }
            }
            if (noteData) {
              break
            }
          }
          targetNoteStart.current = { ...noteData }
          setStartNoteDrag({
            note: noteID,
            type,
            preselected: Object.values(selectedNotes).flat().includes(noteID),
          })
        } else if (event.target.closest('.delimiter') && !event.target.classList.contains('delimiter-x')) {
          //
          // dragging delimiters
          //
          setNoPointerEvents(true)
          setEwResizing(true)
          setSelectNotes({})
          const di = +event.target.closest('.delimiter').getAttribute('index')
          setDraggingDelimiter(di)
          wasDraggingDelimiter.current = di
          const delimiter = delimiters[di]
          dragStart.current = delimiter.snap ? timeToPixels({ [delimiter.snap]: delimiter.snapNumber }) : delimiter.x
          snapStart.current = delimiter.snap
        } else if (event.target.classList.contains('delimiter-probability-bar-drag')) {
          //
          // dragging probability bar
          //
          setNoPointerEvents(true)
          setNsResizing(true)
          delimitersRef.current = delimiters
          delimiterIndex.current = +event.target.getAttribute('delimiter-index')
          laneID.current = event.target.getAttribute('lane-id')
          fullHeight.current = +event.target.getAttribute('full-height')
          percentage.current = { ...delimiters[delimiterIndex.current].lanes }
          setChangingProbability(delimiterIndex.current)
        } else if (event.target.closest('#end')) {
          //
          // dragging transport end
          //
          setNoPointerEvents(true)
          setEwResizing(true)
          draggingEnd.current = uiState.end
          dragStart.current = uiState.end.x
          snapStart.current = uiState.end.snap
        } else if (event.target.closest('#playhead') || event.target.closest('#transport-topbar')) {
          const topbarDrag = event.target.closest('#transport-topbar')
          //
          // dragging playhead
          //
          setNoPointerEvents(true)
          setEwResizing(true)
          draggingPlayhead.current = true
          const leftOffset = document.querySelector('#lanes-container').getBoundingClientRect().left + 14
          const startX = snapPixels(x - leftOffset, snap).px
          dragStart.current = topbarDrag ? startX : positionToPixels(Tone.Transport.position)
          snapStart.current = snap
          if (topbarDrag) {
            cancelClick.current = true
            // set playhead if dragging from topbar
            Tone.Transport.position = new Tone.Time(pixelsToTime(startX, snap)).toBarsBeatsSixteenths()
            setPlayheadPosition(startX)
            updateChosenLane(startX)
          }
        } else {
          //
          // drag selecting
          //
          dragSelecting.current = true
          setSelectingDimensions({
            x,
            y,
            width: 0,
            height: 0,
          })
        }
      }
    },
    onDrag: ({ movement: [mx, my], direction: [dx], initial: [ix, iy], metaKey }) => {
      if (!metaKey) {
        if (dragSelecting.current) {
          //
          // drag selecting
          //
          const newDimensions = { width: Math.abs(mx), height: Math.abs(my) }
          newDimensions.x = (mx > 0 ? ix : ix - newDimensions.width) + mainContainerRef?.current?.scrollLeft
          newDimensions.y = (my > 0 ? iy : iy - newDimensions.height) + mainContainerRef?.current?.scrollTop
          setSelectingDimensions(newDimensions)
        } else if (draggingNote.current) {
          //
          // dragging notes
          //
          setNoteDrag({
            movement: [mx, my],
            direction: [dx],
          })
        } else if (draggingDelimiter !== null) {
          //
          // dragging delimiters
          //
          dragChanged.current = mx
          if (dragStart.current !== undefined && (Math.abs(mx) > 2 || overrideDefault.current)) {
            if (dx) {
              dragDirection.current = dx
            }
            const lowerSnapBound = snap && snapPixels(dragStart.current, snap, -1).px
            const upperSnapBound = snap && lowerSnapBound + EIGHTH_WIDTH * RATE_MULTS[snap]
            const realX = dragStart.current + mx
            if (snap && !snapStart.current && (realX < lowerSnapBound || realX > upperSnapBound)) {
              snapStart.current = snap
            }
            const direction = !snapStart.current ? dragDirection.current : 0
            const { px, snapNumber } = snapPixels(realX, snap, direction)
            const minX = draggingDelimiter * MIN_DELIMITER_WIDTH
            const maxX = windowLaneLength * EIGHTH_WIDTH - (delimiters.length - draggingDelimiter) * MIN_DELIMITER_WIDTH
            let x = px
            let snapX = snap
            let snapNumberX = snapNumber
            if (x < minX || x > maxX) {
              snapX = null
              snapNumberX = null
            }
            x = constrain(x, minX, maxX)
            if (snap && x !== dragStart.current) {
              overrideDefault.current = true
            }
            // set delimiter positions
            if (x !== delimiters[draggingDelimiter].x) {
              const delimitersCopy = delimiters.slice()
              delimitersCopy[draggingDelimiter] = Object.assign(delimitersCopy[draggingDelimiter], {
                snap: snapX,
                snapNumber: snapNumberX,
                x,
              })
              // push other delimiters if this one is running up against them
              for (let i = draggingDelimiter - 1; i > 0; i--) {
                const maxX = x - (draggingDelimiter - i) * MIN_DELIMITER_WIDTH
                if (delimiters[i].x > maxX) {
                  delimiters[i].snap = null
                  delimiters[i].x = maxX
                }
              }
              for (let i = draggingDelimiter + 1; i < delimiters.length; i++) {
                const minX = x + (i - draggingDelimiter) * MIN_DELIMITER_WIDTH
                if (delimiters[i].x < minX) {
                  delimiters[i].snap = null
                  delimiters[i].x = minX
                }
              }
              setDelimiters(delimitersCopy)
            }
            updateChosenLane()
          }
        } else if (changingProbability !== null) {
          //
          // dragging probability bar
          //
          const percentChange = constrain(
            my / -fullHeight.current,
            -percentage.current[laneID.current],
            1 - percentage.current[laneID.current]
          )
          if (percentChange) {
            function updateDOMHeight(delimiterLaneID, pct) {
              const lane = uiState.lanes.find((l) => l.id === delimiterLaneID)
              const probabilityBar = document.querySelector(
                `#lane-${delimiterLaneID} .delimiter-probability:nth-child(${
                  delimiterIndex.current + 1
                }) .delimiter-probability-bar`
              )
              const laneHeight = (lane.viewRange.max - lane.viewRange.min + 1) * NOTE_HEIGHT
              probabilityBar.style.height = laneHeight * pct + 'px'
              const probabilityNumber = probabilityBar.querySelector('.delimiter-probability-number')
              probabilityNumber.innerHTML = pct.toFixed(2)
              if ((1 - pct) * laneHeight <= 16) {
                probabilityNumber.classList.add('number-below')
              } else {
                probabilityNumber.classList.remove('number-below')
              }
            }

            let compensationAmount = -percentChange
            const delimiter = delimitersRef.current[delimiterIndex.current]
            delimiter.lanes[laneID.current] = percentage.current[laneID.current] + percentChange
            updateDOMHeight(laneID.current, percentage.current[laneID.current] + percentChange)
            // only affect unmuted lanes
            const otherLanes = Object.keys(delimiter.lanes)
              .filter((delimiterLaneID) => {
                const lane = uiState.lanes.find((l) => l.id === delimiterLaneID)
                return delimiterLaneID !== laneID.current && !lane.mute && (!anyLaneSoloed || lane.solo)
              })
              .map((delimiterLaneID) => ({
                laneID: delimiterLaneID,
                pct: delimiter.lanes[delimiterLaneID],
              }))
              .sort((a, b) => (percentChange > 0 ? a.pct - b.pct : b.pct - a.pct))
            otherLanes.forEach((lane, i) => {
              const compensationSlice = compensationAmount / (otherLanes.length - i)
              const delta =
                percentChange > 0
                  ? Math.max(compensationSlice, -percentage.current[lane.laneID])
                  : Math.min(compensationSlice, 1 - percentage.current[lane.laneID])
              delimiter.lanes[lane.laneID] = percentage.current[lane.laneID] + delta
              updateDOMHeight(lane.laneID, percentage.current[lane.laneID] + delta)
              compensationAmount -= delta
            })
          }
        } else if (draggingPlayhead.current) {
          //
          // dragging playhead
          //
          dragChanged.current = mx
          if (dragStart.current !== undefined) {
            if (dx) {
              dragDirection.current = dx
            }
            const lowerSnapBound = snap && snapPixels(dragStart.current, snap, -1).px
            const upperSnapBound = snap && lowerSnapBound + EIGHTH_WIDTH * RATE_MULTS[snap]
            const realX = dragStart.current + mx
            if (snap && !snapStart.current && (realX < lowerSnapBound || realX > upperSnapBound)) {
              snapStart.current = snap
            }
            const direction = !snapStart.current ? dragDirection.current : 0
            const { px } = snapPixels(realX, snap, direction)
            const minX = 0
            const maxX = windowLaneLength * EIGHTH_WIDTH
            const x = constrain(px, minX, maxX)
            // set playhead
            Tone.Transport.position = new Tone.Time(pixelsToTime(x, snap)).toBarsBeatsSixteenths()
            setPlayheadPosition(x)
            updateChosenLane(x)
          }
        } else if (draggingEnd.current) {
          //
          // dragging transport end
          //
          dragChanged.current = mx
          if (dragStart.current !== undefined) {
            if (dx) {
              dragDirection.current = dx
            }
            const lowerSnapBound = snap && snapPixels(dragStart.current, snap, -1).px
            const upperSnapBound = snap && lowerSnapBound + EIGHTH_WIDTH * RATE_MULTS[snap]
            const realX = dragStart.current + mx
            if (snap && !snapStart.current && (realX < lowerSnapBound || realX > upperSnapBound)) {
              snapStart.current = snap
            }
            const direction = !snapStart.current ? dragDirection.current : 0
            const { px } = snapPixels(realX, snap, direction)
            const minX = 0
            const maxX = windowLaneLength * EIGHTH_WIDTH
            const x = constrain(px, minX, maxX)
            const snapNumber = snapPixels(x, snap).snapNumber
            // set end
            draggingEnd.current = {
              x,
              snap,
              snapNumber,
            }
            setEndPosition(x)
            Tone.Transport.loopEnd = snap ? { [snap]: snapNumber } : pixelsToTime(x)
          }
        }
      }
    },
    onDragEnd: ({ event }) => {
      if (event.button === 0) {
        if (dragSelecting.current) {
          //
          // drag selecting
          //
          const selectedNotes = {}
          // gather notes that intersect with selection bounds
          mainContainerRef.current?.querySelectorAll('.lane-container').forEach((lane, i) => {
            const laneData = uiState.lanes[i]
            for (const note of laneData.notes) {
              const noteX = 34 + note.x + KEYS_WIDTH
              const noteY =
                lane.offsetTop + lane.parentElement.offsetTop + (laneData.viewRange.max - note.midiNote) * NOTE_HEIGHT
              if (
                boxesIntersect(
                  noteX,
                  noteX + note.width,
                  noteY,
                  noteY + NOTE_HEIGHT,
                  selectingDimensions.x,
                  selectingDimensions.x + selectingDimensions.width,
                  selectingDimensions.y,
                  selectingDimensions.y + selectingDimensions.height
                )
              ) {
                if (!selectedNotes[laneData.id]) {
                  selectedNotes[laneData.id] = [note.id]
                } else {
                  selectedNotes[laneData.id].push(note.id)
                }
              }
            }
          })
          setSelectNotes(selectedNotes)
          dragSelecting.current = false
          setSelectingDimensions(null)
        } else if (draggingNote.current) {
          //
          // dragging notes
          //
          setStartNoteDrag(null)
          setNoPointerEvents(false)
          setGrabbing(false)
          setEwResizing(false)
          draggingNote.current = false
        } else if (draggingDelimiter !== null) {
          //
          // dragging delimiters
          //
          if (event.target.classList.contains('delimiter-grab')) {
            delimiterDragHover.current = draggingDelimiter
          }
          setNoPointerEvents(false)
          setEwResizing(false)
          setUIState((uiState) => Object.assign({}, uiState, { delimiters }))
          setDraggingDelimiter(null)
          dragChanged.current = false
          dragDirection.current = 0
          overrideDefault.current = false
        } else if (changingProbability !== null) {
          //
          // dragging probability bar
          //
          setNoPointerEvents(false)
          setNsResizing(false)
          setDelimiters(delimitersRef.current)
          setUIState((uiState) => Object.assign({}, uiState, { delimiters }))
          setChangingProbability(null)
        } else if (draggingPlayhead.current) {
          //
          // dragging playhead
          //
          setNoPointerEvents(false)
          setEwResizing(false)
          draggingPlayhead.current = false
          dragChanged.current = false
          dragDirection.current = 0
        } else if (draggingEnd.current) {
          //
          // dragging transport end
          //
          setNoPointerEvents(false)
          setEwResizing(false)
          dragChanged.current = false
          dragDirection.current = 0
          const end = { ...draggingEnd.current }
          setUIState((uiState) => Object.assign({}, uiState, { end }))
          draggingEnd.current = false
        }
      }
    },
  })

  return { globalDrag }
}
