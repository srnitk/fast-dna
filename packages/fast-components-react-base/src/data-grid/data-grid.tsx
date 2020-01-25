import React, { ReactText } from "react";
import ReactDOM from "react-dom";
import { DataGridClassNameContract } from "@microsoft/fast-components-class-name-contracts-base";
import { get, isNil } from "lodash-es";
import Foundation, { HandledProps } from "@microsoft/fast-components-foundation-react";
import {
    DataGridColumnDefinition,
    DataGridHandledProps,
    DataGridProps,
    DataGridUnhandledProps,
} from "./data-grid.props";
import DataGridRow from "./data-grid-row";
import { classNames, Direction, KeyCodes } from "@microsoft/fast-web-utilities";
import { DataGridCellProps } from "./data-grid-cell.props";
import { DataGridContext, DataGridContextType } from "./data-grid-context";
import { RowPosition } from "./data-grid-row.props";
import StackPanel from "../stack-panel";

export interface DataGridState {
    focusRowKey: React.ReactText;
    focusColumnKey: React.ReactText;
    scrollBarWidth: number;
    itemHeights: number[];
}

class DataGrid extends Foundation<
    DataGridHandledProps,
    DataGridUnhandledProps,
    DataGridState
> {
    public static defaultProps: Partial<DataGridProps> = {
        itemHeight: 33,
        managedClasses: {},
    };

    public static displayName: string = "DataGrid";

    protected handledProps: HandledProps<DataGridHandledProps> = {
        dataRowKey: void 0,
        gridData: void 0,
        columnDefinitions: void 0,
        itemHeight: void 0,
        itemHeightCallback: void 0,
        managedClasses: void 0,
        defaultFocusColumnKey: void 0,
        defaultFocusRowKey: void 0,
    };

    private currentTemplateColumns: string = "";
    private rootElement: React.RefObject<HTMLDivElement>;

    private direction: Direction = Direction.ltr;
    private defaultRowIndex: number = 0;
    private isFocused: boolean = false;

    /**
     * constructor
     */
    constructor(props: DataGridProps) {
        super(props);

        this.rootElement = React.createRef();

        let focusRowKey: React.ReactText = "";
        if (this.props.gridData.length > 0) {
            focusRowKey =
                !isNil(this.props.defaultFocusRowKey) &&
                this.getRowIndexByKey(this.props.defaultFocusRowKey) !== -1
                    ? this.props.defaultFocusRowKey
                    : this.props.gridData[0][this.props.dataRowKey];
        }

        let focusColumnKey: React.ReactText = "";
        if (this.props.columnDefinitions.length > 0) {
            focusColumnKey =
                !isNil(this.props.defaultFocusColumnKey) &&
                this.getColumnIndexByKey(this.props.defaultFocusColumnKey) !== -1
                    ? this.props.defaultFocusColumnKey
                    : this.props.columnDefinitions[0].columnDataKey;
        }

        this.state = {
            itemHeights: [],
            scrollBarWidth: 0,
            focusColumnKey,
            focusRowKey,
        };
    }

    /**
     * Renders the component
     */
    public render(): React.ReactElement<HTMLDivElement> {
        this.currentTemplateColumns = this.getGridTemplateColumns();

        return (
            <DataGridContext.Provider
                value={{
                    onCellFocused: this.handleCellFocus,
                    onCellKeyDown: this.handleCellKeyDown,
                    dataGridState: this.state,
                    dataGridProps: this.props,
                }}
            >
                <div
                    {...this.unhandledProps()}
                    className={this.generateClassNames()}
                    role="grid"
                    tabIndex={-1}
                    onFocus={this.handleGridFocus}
                    onBlur={this.handleGridBlur}
                    ref={this.rootElement}
                >
                    {this.renderGridHeader()}
                    <StackPanel
                        style={{
                            height: "100%",
                            overflowY: "scroll",
                        }}
                    >
                        {this.renderRows()}
                    </StackPanel>
                </div>
            </DataGridContext.Provider>
        );
    }

    /**
     * React life-cycle method
     */
    public componentDidMount(): void {}

    /**
     * React life-cycle method
     */
    public componentWillUnmount(): void {}

    /**
     * React life-cycle method
     */
    public componentDidUpdate(prevProps: DataGridProps): void {}

    /**
     * Allows refs to the component to call focus on the grid
     */
    public focus = (): void => {
        this.focusOnCell(this.state.focusRowKey, this.state.focusColumnKey);
    };

    /**
     * Generates class names
     */
    protected generateClassNames(): string {
        const { dataGrid }: DataGridClassNameContract = this.props.managedClasses;

        return super.generateClassNames(classNames(dataGrid));
    }

    /**
     *  render the header
     */
    private renderGridHeader(): React.ReactElement<HTMLDivElement> {
        return (
            <div
                className={classNames(this.props.managedClasses.dataGrid_header)}
                role="row"
                style={{
                    marginRight: this.state.scrollBarWidth,
                    display: "grid",
                    gridTemplateColumns: this.currentTemplateColumns,
                }}
            >
                {this.props.columnDefinitions.map(this.renderColumnHeader)}
            </div>
        );
    }

    /**
     *  render the data rows
     */
    private renderRows = (): React.ReactChild[] => {
        return this.props.gridData.map(this.renderRow);
    };

    /**
     *  render each column header
     */
    private renderColumnHeader = (
        column: DataGridColumnDefinition,
        index: number
    ): React.ReactNode => {
        if (!isNil(column.header)) {
            return column.header(
                column.title,
                column.columnDataKey,
                index,
                get(this.props.managedClasses, "dataGrid_columnHeader", "")
            );
        } else {
            return this.renderDefaultColumnHeader(
                column.title,
                column.columnDataKey,
                index,
                get(this.props.managedClasses, "dataGrid_columnHeader", "")
            );
        }
    };

    /**
     *  default column render function
     */
    private renderDefaultColumnHeader = (
        columnTitle: React.ReactFragment,
        key: React.ReactText,
        columnIndex: number,
        className: string
    ): React.ReactNode => {
        return (
            <div
                className={className}
                role="columnheader"
                key={key}
                style={{
                    gridColumn: columnIndex + 1,
                }}
            >
                {columnTitle}
            </div>
        );
    };

    /**
     * Render a single data row
     */
    private renderRow = (rowData: object, index: number): React.ReactChild => {
        const rowKey: React.ReactText = !isNil(rowData[this.props.dataRowKey])
            ? rowData[this.props.dataRowKey]
            : index;
        const {
            dataGrid_row,
            dataGrid_row__focusWithin,
            dataGrid_cell,
        }: DataGridClassNameContract = this.props.managedClasses;

        return (
            <DataGridRow
                key={rowKey}
                rowIndex={index}
                rowData={rowData}
                gridTemplateColumns={this.currentTemplateColumns}
                managedClasses={{
                    dataGridRow: dataGrid_row,
                    dataGridRow__focusWithin: dataGrid_row__focusWithin,
                    dataGridRow_cell: dataGrid_cell,
                }}
            />
        );
    };

    /**
     *  Generates the grid template column css string
     */
    private getGridTemplateColumns = (): string => {
        let templateColumns: string = "";

        this.props.columnDefinitions.forEach(
            (columnDefinition: DataGridColumnDefinition) => {
                templateColumns = `${templateColumns} ${columnDefinition.columnWidth}`;
            }
        );

        return templateColumns;
    };

    /**
     * When the cell with focus scrolls out of the viewport we may need to blur it
     */
    private blurCurrentFocusCell = (): void => {
        if (isNil(this.rootElement.current)) {
            return;
        }

        if (this.rootElement.current.contains(document.activeElement)) {
            (document.activeElement as HTMLElement).blur();
        }
    };

    /**
     * gets the first row where the row bottom exceeds the threshold value
     * returns final item index if no rows reach threshold value
     */
    private getThresholdRowIndex = (
        rowPositions: RowPosition[],
        startRowIndex: number,
        threshold: number
    ): number => {
        if (rowPositions.length === 0) {
            return 0;
        }
        let thresholdRowIndex: number = rowPositions.length - 1;
        for (
            let i: number = startRowIndex, rowCount: number = rowPositions.length;
            i < rowCount;
            i++
        ) {
            const thisRowPosition: RowPosition = rowPositions[i];
            if (thisRowPosition.bottom >= threshold) {
                thresholdRowIndex = i;
                break;
            }
        }

        return thresholdRowIndex;
    };

    /**
     *  Handle grid focus by enusuring we only focus on gridcells
     */
    private handleGridFocus = (e: React.FocusEvent<HTMLElement>): void => {
        if (!e.defaultPrevented && e.target.getAttribute("role") !== "gridcell") {
            this.focusOnCell(this.state.focusRowKey, this.state.focusColumnKey);
        }
        if (!this.isFocused) {
            this.isFocused = true;
        }
    };

    /**
     *  Handle grid blur by setting focused state
     */
    private handleGridBlur = (e: React.FocusEvent<HTMLElement>): void => {
        const root: HTMLDivElement = this.rootElement.current;
        // If we focus outside of the data grid
        if (!!root && !root.contains(e.relatedTarget as HTMLElement)) {
            this.isFocused = false;
        }
    };

    /**
     * Handle the keydown event of the item
     */
    private handleCellKeyDown = (
        cell: DataGridCellProps,
        e: React.KeyboardEvent<HTMLElement>
    ): void => {
        if (e.defaultPrevented) {
            return;
        }

        switch (e.keyCode) {
            case KeyCodes.arrowDown:
                e.preventDefault();
                this.incrementFocusRow(1);
                break;

            case KeyCodes.arrowRight:
                this.incrementFocusColumn(1);
                e.preventDefault();
                break;

            case KeyCodes.arrowUp:
                this.incrementFocusRow(-1);
                e.preventDefault();
                break;

            case KeyCodes.arrowLeft:
                this.incrementFocusColumn(-1);
                e.preventDefault();
                break;

            // case KeyCodes.pageDown:
            //     this.incrementFocusRow(this.getPageHeightInRows());
            //     e.preventDefault();
            //     break;

            // case KeyCodes.pageUp:
            //     this.incrementFocusRow(-this.getPageHeightInRows());
            //     e.preventDefault();
            //     break;

            case KeyCodes.home:
                if (e.ctrlKey) {
                    this.incrementFocusRow(-this.props.gridData.length);
                } else {
                    this.incrementFocusColumn(-this.props.columnDefinitions.length);
                }
                e.preventDefault();
                break;

            case KeyCodes.end:
                if (e.ctrlKey) {
                    this.incrementFocusRow(this.props.gridData.length);
                } else {
                    this.incrementFocusColumn(this.props.columnDefinitions.length);
                }
                e.preventDefault();
                break;
        }
    };

    /**
     * move focus to another row
     */
    private incrementFocusRow = (direction: number): void => {
        // let currentFocusRowIndex: number = this.getRowIndexByKey(this.state.focusRowKey);
        // if (currentFocusRowIndex === -1) {
        //     currentFocusRowIndex = 0;
        // }
        // let newFocusRowIndex: number = currentFocusRowIndex + direction;
        // if (newFocusRowIndex < 0) {
        //     newFocusRowIndex = 0;
        // } else if (newFocusRowIndex >= this.props.gridData.length) {
        //     newFocusRowIndex = this.props.gridData.length - 1;
        // }
        // const newFocusRowKey: React.ReactText = this.props.gridData[newFocusRowIndex][
        //     this.props.dataRowKey
        // ];
        // const rows: Element[] = this.domChildren(this.gridContainerElement.current);
        // let rowElement: Element = rows.find((element: HTMLElement) => {
        //     return element.getAttribute(RowIdKey) === newFocusRowKey;
        // });
        // // if we try to move focus outside the range of instanciated elements
        // // focus on an element at the end/beginning of the range instead
        // if (isNil(rowElement)) {
        //     rowElement = direction > 0 ? rows[rows.length - 1] : rows[0];
        // }
        // const cellElement: Element = this.domChildren(rowElement as HTMLElement).find(
        //     (element: HTMLElement) => {
        //         return element.getAttribute(CellIdKey) === this.state.focusColumnKey;
        //     }
        // );
        // if (isNil(cellElement)) {
        //     return;
        // }
        // (cellElement as HTMLElement).focus();
    };

    /**
     *  move focus to another column
     */
    private incrementFocusColumn = (direction: number): void => {
        this.updateDirection();

        const directionMod: number = this.direction === Direction.ltr ? 1 : -1;

        let currentFocusColumnIndex: number = this.getColumnIndexByKey(
            this.state.focusColumnKey
        );

        if (currentFocusColumnIndex === -1) {
            currentFocusColumnIndex = 0;
        }

        let newFocusColumnIndex: number =
            currentFocusColumnIndex + direction * directionMod;

        if (newFocusColumnIndex < 0) {
            newFocusColumnIndex = 0;
        } else if (newFocusColumnIndex >= this.props.columnDefinitions.length) {
            newFocusColumnIndex = this.props.columnDefinitions.length - 1;
        }

        const newFocusColumnKey: React.ReactText = this.props.columnDefinitions[
            newFocusColumnIndex
        ].columnDataKey;

        const rowElement: Element = this.getRowElementByKey(this.state.focusRowKey);

        if (isNil(rowElement)) {
            return;
        }

        const cellElement: Element = this.getCellElementByKey(
            newFocusColumnKey,
            rowElement
        );

        if (cellElement instanceof HTMLElement) {
            cellElement.focus();
        }
    };

    /**
     *  Get row element by key
     */
    private getRowElementByKey = (rowId: React.ReactText): Element => {
        // if (
        //     isNil(this.gridContainerElement) ||
        //     isNil(this.gridContainerElement.current)
        // ) {
        //     return null;
        // }
        // const rowElement: Element = this.domChildren(
        //     this.gridContainerElement.current
        // ).find((element: Element) => {
        //     return element.getAttribute(RowIdKey) === rowId;
        // });
        return null;
    };

    /**
     *  Get cell element by key
     */
    private getCellElementByKey = (
        columnKey: React.ReactText,
        rowElement: Element
    ): Element => {
        // if (isNil(rowElement)) {
        //     return null;
        // }
        // const cellElement: Element = this.domChildren(rowElement as HTMLElement).find(
        //     (element: Element) => {
        //         return element.getAttribute(CellIdKey) === columnKey;
        //     }
        // );
        return null;
    };

    /**
     *  Move focus to a cell based on row and cell id
     *  note: only works with rows that are currently instanciated
     */
    private focusOnCell = (rowId: React.ReactText, cellId: React.ReactText): void => {
        const rowElement: Element = this.getRowElementByKey(rowId);

        if (isNil(rowElement)) {
            return;
        }

        const cellElement: Element = this.getCellElementByKey(cellId, rowElement);

        if (cellElement instanceof HTMLElement) {
            cellElement.focus();
        }
    };

    /**
     * Return an array of all elements that are children
     * of the data container
     */
    // private domChildren = (element: HTMLElement): Element[] => {
    //     return canUseDOM() && this.gridContainerElement.current instanceof HTMLElement
    //         ? Array.from(element.children)
    //         : [];
    // };

    /**
     *  Get column index by key
     */
    private getColumnIndexByKey = (columnKey: React.ReactText): number => {
        const currentColumnIndex: number = this.props.columnDefinitions.findIndex(
            (columnDefinition: DataGridColumnDefinition) => {
                return columnDefinition.columnDataKey === columnKey;
            }
        );
        return currentColumnIndex;
    };

    /**
     * Get row index by key
     */
    private getRowIndexByKey = (rowKey: ReactText): number => {
        const currentFocusRowIndex: number = this.props.gridData.findIndex(
            (dataRow: object) => {
                return dataRow[this.props.dataRowKey] === rowKey;
            }
        );
        return currentFocusRowIndex === -1 ? this.defaultRowIndex : currentFocusRowIndex;
    };

    /**
     * Get rowKey
     */
    private getFocusRowKey = (rowKey: ReactText): ReactText => {
        const currentFocusRowIndex: number = this.props.gridData.findIndex(
            (dataRow: object) => {
                return dataRow[this.props.dataRowKey] === rowKey;
            }
        );
        if (currentFocusRowIndex === -1 && this.props.gridData.length > 0) {
            return this.props.gridData[this.defaultRowIndex][this.props.dataRowKey];
        } else {
            return rowKey;
        }
    };

    /**
     * Handle focus event
     */
    private handleCellFocus = (
        cell: DataGridCellProps,
        e: React.FocusEvent<HTMLElement>
    ): void => {
        if (e.defaultPrevented) {
            return;
        }
        this.setState({
            focusRowKey: cell.rowData[this.props.dataRowKey],
            focusColumnKey: cell.columnDefinition.columnDataKey,
        });
    };

    /**
     *  Updates the direction
     */
    private updateDirection = (): void => {
        if (this.rootElement.current === null) {
            return;
        }

        const closest: Element = this.rootElement.current.closest(`[dir]`);

        if (closest === null) {
            this.direction = Direction.ltr;
            return;
        }

        this.direction =
            closest.getAttribute("dir").toLowerCase() === "rtl"
                ? Direction.rtl
                : Direction.ltr;
    };
}

export default DataGrid;
export * from "./data-grid.props";
export { DataGridContext, DataGridContextType, DataGridClassNameContract };
