import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import fetch from "cross-fetch";
import initialState from "./initialState";
import { Node } from "../types/Node";
import { Block } from "../types/Block";
import { RootState } from "../store/configureStore";
import {
  ERRORED_STATE_BLOCK,
  LOADING_STATE_BLOCK,
} from "../constants/blocks";
export interface NodesState {
  list: Node[];
}

const fetchNodeName = async (node: Node) => {
  const response = await fetch(`${node.url}/api/v1/status`);
  const data: { node_name: string } = await response.json();
  return data;
};

const fetchNodeBlocks = async (node: Node) => {
  const response = await fetch(`${node.url}/api/v1/blocks`);
  const data: { data: Block[] } = await response.json();
  return data;
};

export const fetchNodes = createAsyncThunk(
  "nodes/fetch",
  async (node: Node) => {
    const { node_name } = await fetchNodeName(node);
    const { data: blocks } = await fetchNodeBlocks(node);
    const data = { node_name, blocks };
    return data;
  }
);

export const checkNodesStatus = createAsyncThunk(
  "nodes/checkNodesStatus",
  async (nodes: Node[], thunkAPI) => {
    const { dispatch } = thunkAPI;
    nodes.forEach((node) => {
      dispatch(fetchNodes(node));
    });
  }
);

export const nodesSlice = createSlice({
  name: "nodes",
  initialState: initialState().nodes as NodesState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchNodes.pending, (state, action) => {
      const node = state.list.find((n) => n.url === action.meta.arg.url);
      if (node) {
        node.loading = true;
        node.blocks = LOADING_STATE_BLOCK;
      }
    });
    builder.addCase(fetchNodes.fulfilled, (state, action) => {
      const node = state.list.find((n) => n.url === action.meta.arg.url);
      if (node) {
        node.online = true;
        node.loading = false;
        node.name = action.payload.node_name;
        node.blocks = action.payload.blocks;
      }
    });
    builder.addCase(fetchNodes.rejected, (state, action) => {
      const node = state.list.find((n) => n.url === action.meta.arg.url);
      if (node) {
        node.online = false;
        node.loading = false;
        node.blocks = ERRORED_STATE_BLOCK;
      }
    });
  },
});

export const selectNodes = (state: RootState) => state.nodes.list;
export default nodesSlice.reducer;
