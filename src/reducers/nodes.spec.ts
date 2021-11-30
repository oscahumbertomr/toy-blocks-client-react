import mockFetch from "cross-fetch";
import reducer, { fetchNodes } from "./nodes";
import { Node } from "../types/Node";
import initialState from "./initialState";
import { Block } from "../types/Block";
import { ERRORED_STATE_BLOCK, LOADING_STATE_BLOCK } from "../constants/blocks";

jest.mock("cross-fetch");

const mockedFech: jest.Mock<unknown> = mockFetch as any;

describe("Reducers::Nodes", () => {
  const getInitialState = () => {
    return initialState().nodes;
  };

  const blocks: Block[] = [
    {
      id: "1",
      attributes: {
        data: "The Human Torch",
      },
    },
  ];

  const nodeA: Node = {
    url: "http://localhost:3002",
    online: false,
    name: "Node 1",
    loading: false,
    blocks,
  };

  const nodeB: Node = {
    url: "http://localhost:3003",
    online: false,
    name: "Node 2",
    loading: false,
    blocks,
  };

  it("should set initial state by default", () => {
    const action = { type: "unknown" };
    const expected = getInitialState();

    expect(reducer(undefined, action)).toEqual(expected);
  });

  it("should handle fetchNodes.pending", () => {
    const appState = {
      list: [nodeA, nodeB],
    };
    const action = { type: fetchNodes.pending, meta: { arg: nodeA } };
    const expected = {
      list: [
        {
          ...nodeA,
          loading: true,
          blocks: LOADING_STATE_BLOCK,
        },
        nodeB,
      ],
    };

    expect(reducer(appState, action)).toEqual(expected);
  });

  it("should handle fetchNodes.fulfilled", () => {
    const appState = {
      list: [nodeA, nodeB],
    };
    const action = {
      type: fetchNodes.fulfilled,
      meta: { arg: nodeA },
      payload: { node_name: "alpha", blocks },
    };
    const expected = {
      list: [
        {
          ...nodeA,
          online: true,
          name: "alpha",
          loading: false,
          blocks,
        },
        nodeB,
      ],
    };

    expect(reducer(appState, action)).toEqual(expected);
  });

  it("should handle fetchNodes.rejected", () => {
    const appState = {
      list: [
        {
          ...nodeA,
          online: true,
          name: "alpha",
          loading: false,
          blocks,
        },
        nodeB,
      ],
    };
    const action = { type: fetchNodes.rejected, meta: { arg: nodeA } };
    const expected = {
      list: [
        {
          ...nodeA,
          online: false,
          name: "alpha",
          loading: false,
          blocks: ERRORED_STATE_BLOCK,
        },
        nodeB,
      ],
    };

    expect(reducer(appState, action)).toEqual(expected);
  });
});

describe("Actions::Nodes", () => {
  const dispatch = jest.fn();

  afterAll(() => {
    dispatch.mockClear();
    mockedFech.mockClear();
  });

  const blocks: Block[] = [
    {
      id: "1",
      attributes: {
        data: "The Human Torch",
      },
    },
  ];
  const node: Node = {
    url: "http://localhost:3002",
    online: false,
    name: "Node 1",
    loading: false,
    blocks,
  };

  it("should fetch the node status", async () => {
    mockedFech.mockReturnValue(
      Promise.resolve({
        status: 200,
        json() {
          return Promise.resolve({
            node_name: "Secret Lowlands",
            data: blocks,
          });
        },
      })
    );
    await fetchNodes(node)(dispatch, () => {}, {});

    const expected = expect.arrayContaining([
      expect.objectContaining({
        type: fetchNodes.pending.type,
        meta: expect.objectContaining({ arg: node }),
      }),
      expect.objectContaining({
        type: fetchNodes.fulfilled.type,
        meta: expect.objectContaining({ arg: node }),
        payload: { node_name: "Secret Lowlands", blocks },
      }),
    ]);
    expect(dispatch.mock.calls.flat()).toEqual(expected);
  });

  it("should fail to fetch the node status", async () => {
    mockedFech.mockReturnValueOnce(Promise.reject(new Error("Network Error")));
    await fetchNodes(node)(dispatch, () => {}, {});
    const expected = expect.arrayContaining([
      expect.objectContaining({
        type: fetchNodes.pending.type,
        meta: expect.objectContaining({ arg: node }),
      }),
      expect.objectContaining({
        type: fetchNodes.rejected.type,
        meta: expect.objectContaining({ arg: node }),
        error: expect.objectContaining({ message: "Network Error" }),
      }),
    ]);

    expect(dispatch.mock.calls.flat()).toEqual(expected);
  });
});
