import { configureStore } from '@reduxjs/toolkit'
import blogReducer from './pages/blog/blog.slice'
import { useDispatch } from 'react-redux'

export const store = configureStore({
    reducer: { blog: blogReducer }
})

// Lấy RootState và AppDispatch từ store của chúng ta
// Tạo kiểu dữ liệu để gán cho tham số truyền vào vd hàm: useSelector((state: RootState) => state.blog.editingPost)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
// khi dùng với asyncThunk thì dùng useAppDispatch này
export const useAppDispatch = () => useDispatch<AppDispatch>()
