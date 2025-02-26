const { Gio, GLib, St } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;

let settings;

function _patchOverviewControls() {
    const overviewControls = Main.overview._overview.controls;

    // Simpan fungsi asli
    if (!overviewControls._originalComputeWorkspacesBox) {
        overviewControls._originalComputeWorkspacesBox = overviewControls._computeWorkspacesBoxForState;
    }

    overviewControls._computeWorkspacesBoxForState = function(state, box, searchHeight, dashHeight, thumbnailsHeight) {
        const dashEnabled = settings.get_boolean('dash-enabled');

        const workspaceBox = box.copy();
        const [width, height] = workspaceBox.get_size();
        const { y1: startY } = this._workAreaBox;
        const expandFraction = this._workspacesThumbnails.visible ? this._workspacesThumbnails.expandFraction : 0;

        switch (state) {
            case ControlsState.HIDDEN:
                workspaceBox.set_origin(...this._workAreaBox.get_origin());
                workspaceBox.set_size(...this._workAreaBox.get_size());
                break;
            case ControlsState.WINDOW_PICKER:
                workspaceBox.set_origin(0,
                    startY + searchHeight + this._spacing +
                    thumbnailsHeight + this._spacing * expandFraction);
                workspaceBox.set_size(width,
                    height -
                    (dashEnabled ? (dashHeight - this._spacing) : 0) -
                    searchHeight - this._spacing -
                    thumbnailsHeight - this._spacing * expandFraction);
                break;
            case ControlsState.APP_GRID:
                workspaceBox.set_origin(0, startY + searchHeight + this._spacing);
                workspaceBox.set_size(width, Math.round(height * 0.7));
                break;
        }

        return workspaceBox;
    };
}

function _restoreOverviewControls() {
    const overviewControls = Main.overview._overview.controls;
    if (overviewControls._originalComputeWorkspacesBox) {
        overviewControls._computeWorkspacesBoxForState = overviewControls._originalComputeWorkspacesBox;
        delete overviewControls._originalComputeWorkspacesBox;
    }
}

function init() {
    settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.gnomemobileaddons');
}

function enable() {
    _patchOverviewControls();
}

function disable() {
    _restoreOverviewControls();
}
