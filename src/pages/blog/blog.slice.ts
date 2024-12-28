import { AsyncThunk, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import http from 'utils/http'
import { Post } from '../../@types/blog.type'

type GenericAsyncThunk = AsyncThunk<unknown, unknown, any>
type PendingAction = ReturnType<GenericAsyncThunk['pending']>
type RejectedAction = ReturnType<GenericAsyncThunk['rejected']>
type FulfilledAction = ReturnType<GenericAsyncThunk['fulfilled']>

interface BlogState {
    postList: Post[]
    editingPost: Post | null
    loading: boolean
    currentRequestId: undefined | string
}

// tạo state cho Blog
const initialState: BlogState = {
    postList: [],
    editingPost: null,
    loading: false,
    currentRequestId: undefined
}

// tạo các action
// dùng createAsyncthunk để xử lý event bất đồng bộ
export const getPostList = createAsyncThunk('blog/getPostList', async (_, thunkApi) => {
    const response = await http.get<Post[]>('posts', {
        signal: thunkApi.signal // loại bỏ 2 lần call api của trick mode => chỉ còn 1 lần call api
    })

    return response.data
})

export const addPost = createAsyncThunk('blog/addPost', async (body: Omit<Post, 'id'>, thunkApi) => {
    try {
        const response = await http.post<Post>('posts', body, {
            signal: thunkApi.signal // loại bỏ 2 lần call api của trick mode => chỉ còn 1 lần call api
        })

        return response.data
    } catch (error: any) {
        // handle error
        if (error.name === 'AxiosError' && error.response.status === 422) {
            return thunkApi.rejectWithValue(error.response.data)
        }

        throw error
    }
})

export const updatePost = createAsyncThunk(
    'blog/updatePost',
    async ({ postId, body }: { postId: string; body: Post }, thunkApi) => {
        try {
            const response = await http.put<Post>(`posts/${postId}`, body, {
                signal: thunkApi.signal // loại bỏ 2 lần call api của trick mode => chỉ còn 1 lần call api
            })

            return response.data
        } catch (error: any) {
            // handle error
            if (error.name === 'AxiosError' && error.response.status === 422) {
                return thunkApi.rejectWithValue(error.response.data)
            }

            throw error
        }
    }
)

export const deletePost = createAsyncThunk('blog/deletePost', async (postId: string, thunkApi) => {
    const response = await http.delete<Post>(`posts/${postId}`, {
        signal: thunkApi.signal // loại bỏ 2 lần call api của trick mode => chỉ còn 1 lần call api
    })

    return response.data
})

// tạo slice chứa reducer và dispatch action
const blogSlice = createSlice({
    name: 'blog',
    initialState,
    // reducers -> map object
    // reducers chỉ sử lý action đồng bộ
    reducers: {
        startEditingPost: (state, action: PayloadAction<string>) => {
            const postId = action.payload
            const foundPost = state.postList.find(post => post.id === postId) || null
            state.editingPost = foundPost
        },

        cancelEditingPost: state => {
            state.editingPost = null
        }
    },

    // extraReducers -> builder callback
    // xử lý action không đồng bộ => chuyên dùng cho TS
    extraReducers(builder) {
        builder
            .addCase(getPostList.fulfilled, (state, action) => {
                state.postList = action.payload
            })
            .addCase(addPost.fulfilled, (state, action) => {
                state.postList.push(action.payload)
            })
            .addCase(updatePost.fulfilled, (state, action) => {
                state.postList.find((post, index) => {
                    if (post.id === action.payload.id) {
                        state.postList[index] = action.payload
                        return true
                    }
                    return false
                })
                state.editingPost = null
            })
            .addCase(deletePost.fulfilled, (state, action) => {
                const postId = action.meta.arg // là thằng Id tham số đầu tiên truyền vào
                const deletePostIndex = state.postList.findIndex(post => post.id === postId)

                if (deletePostIndex !== -1) {
                    state.postList.splice(deletePostIndex, 1)
                }
            })
            // addMatcher -> thực hiện khi chứa các key string trong action
            // addMatcher -> dùng cho event loading cho toàn app
            .addMatcher<PendingAction>(
                action => action.type.endsWith('/pending'),
                (state, action) => {
                    state.loading = true
                    state.currentRequestId = action.meta.requestId // requestId -> khi gọi createAsyncThunk thì nó sinh ra 1 ID unique
                }
            )
            .addMatcher<RejectedAction | FulfilledAction>(
                action => action.type.endsWith('/rejected') || action.type.endsWith('/fulfilled'),
                (state, action) => {
                    if (state.loading && state.currentRequestId === action.meta.requestId) {
                        state.loading = false
                        state.currentRequestId = undefined
                    }
                }
            )
        // trường hợp không nhảy vào các action ở trên thì nhảy vào default case
        // .addDefaultCase((state, action) => {
        //     console.log('action type: ', action.type, current(state))
        // })
    }
})

export const { cancelEditingPost, startEditingPost } = blogSlice.actions // đưa ra các action tron reducer
const blogReducer = blogSlice.reducer // đưa ra reducer

export default blogReducer
