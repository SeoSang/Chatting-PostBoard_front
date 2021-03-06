import React, { useEffect, useState } from "react"
import { makeStyles } from "@material-ui/core/styles"
import Paper from "@material-ui/core/Paper"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import TableCell from "@material-ui/core/TableCell"
import TableContainer from "@material-ui/core/TableContainer"
import TableHead from "@material-ui/core/TableHead"
import TablePagination from "@material-ui/core/TablePagination"
import TableRow from "@material-ui/core/TableRow"
import { useStore } from "../stores"
import { observer } from "mobx-react"
import moment from "moment"
import { Button, Modal, Typography } from "@material-ui/core"
import { FlexDiv } from "../styles/div"
import ChattingRoomForm from "../forms/ChattingRoomForm"
import EnterRoomForm from "../forms/EnterRoomForm"
import { BACKEND_URL } from "../util/util"
import { RoomData } from "../types/chat"
import io from "socket.io-client"
import { useMarginStyles, useTypicalStyles } from "../styles/cssStyles"
import clsx from "clsx"

interface Column {
  id: "owner" | "title" | "userCount" | "createdAt" | "max"
  label: string
  minWidth?: number
  align?: "right"
  format?: (value: any) => string
}

const columns: Column[] = [
  {
    id: "owner",
    label: "방장",
    minWidth: 100,
    format: (data: any) => data.nickname,
  },
  { id: "title", label: "제목", minWidth: 200 },
  {
    id: "userCount",
    label: "참여자",
    minWidth: 30,
  },
  {
    id: "max",
    label: "최대",
    minWidth: 30,
  },
  {
    id: "createdAt",
    label: "생성일",
    minWidth: 50,
    format: (date) => moment(date).format("lll"),
  },
]

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  container: {
    maxHeight: 440,
  },
  buttonContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-end",
    margin: theme.spacing(1, 0),
  },
}))

function room() {
  const st = useStyles()
  const [page, setPage] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [test, setTest] = React.useState(true)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const { chatStore } = useStore()
  const [rooms, setRooms] = useState<typeof chatStore.rooms | null>()

  const typ = useTypicalStyles()
  const mar = useMarginStyles()

  useEffect(() => {
    const socket = io.connect(`${BACKEND_URL}/room`, {
      // 네임스페이스
      path: "/socket.io",
    })
    socket.on("newRoom", function (data: RoomData) {
      // 새 방 이벤트 시 새 방 생성
      chatStore.addRoomBySocket(data)
    })

    socket.on("removeRoom", function (data: RoomData) {
      // 방 제거 이벤트 시 id가 일치하는 방 제거
      chatStore.removeRoomBySocket(data)
    })
  }, [BACKEND_URL])

  useEffect(() => {
    const getRooms = async () => {
      await chatStore.loadRooms()
      setRooms(chatStore.rooms)
    }
    const timer = setTimeout(getRooms, 200)
    return () => {
      clearTimeout(timer)
    }
  }, [chatStore])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const handleOpen = () => {
    // setOpen(true)
    chatStore?.openCreateForm()
  }

  const handleClose = () => {
    chatStore?.closeCreateForm()
  }

  return (
    <FlexDiv direction='column'>
      <Typography className={clsx(typ.bold, mar.marBottom2)} variant='h4'>
        비밀채팅방
      </Typography>
      <Paper className={st.root}>
        <TableContainer className={st.container}>
          <Table stickyHeader aria-label='sticky table'>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}>
                    {column.label}
                  </TableCell>
                ))}
                <TableCell style={{ minWidth: 20 }}>{"입장"}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  return (
                    <TableRow hover role='checkbox' tabIndex={-1} key={row.id}>
                      {columns.map((column) => {
                        const value = column.format
                          ? column.format(row[column.id])
                          : row[column.id]
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {value}
                          </TableCell>
                        )
                      })}
                      <TableCell style={{ minWidth: 20 }}>
                        <Button
                          color='primary'
                          variant='contained'
                          onClick={() => {
                            setOpen(true)
                          }}>
                          입장
                        </Button>
                      </TableCell>
                      <Modal
                        open={open}
                        onClose={() => {
                          setOpen(false)
                          setTest(false)
                        }}>
                        <EnterRoomForm
                          roomId={row.id}
                          max={row.max}
                          title={row.title}
                        />
                      </Modal>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component='div'
          count={rooms ? rooms.length : 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </Paper>
      <div className={st.buttonContainer}>
        <Button color='primary' variant='contained' onClick={handleOpen}>
          생성하기
        </Button>
        <Modal open={chatStore?.createFormOpen} onClose={handleClose}>
          <ChattingRoomForm />
        </Modal>
      </div>
    </FlexDiv>
  )
}

export default observer(room)
